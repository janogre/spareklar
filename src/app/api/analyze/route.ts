import { NextRequest, NextResponse } from "next/server";
import { analyzeTransactions } from "@/lib/claude";
import { parseCSV, parsePDF } from "@/lib/parsers";
import { kv } from "@/lib/kv";

export const maxDuration = 60;

interface TextInput {
  inputType: "text";
  data: string;
}

interface CSVInput {
  inputType: "csv";
  data: Record<string, string>[];
}

interface PDFInput {
  inputType: "pdf";
  data: string; // base64-encoded PDF
}

type AnalyzeRequest = TextInput | CSVInput | PDFInput;

export async function POST(request: NextRequest) {
  let body: AnalyzeRequest;

  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel. Forventet JSON." },
      { status: 400 }
    );
  }

  if (!body.inputType || !body.data) {
    return NextResponse.json(
      { error: "Mangler inputType eller data." },
      { status: 400 }
    );
  }

  let transactionText: string;

  try {
    if (body.inputType === "text") {
      transactionText = (body.data as string).trim();
      if (!transactionText) {
        return NextResponse.json(
          { error: "Tom tekst sendt inn." },
          { status: 400 }
        );
      }
    } else if (body.inputType === "csv") {
      const rows = body.data as Record<string, string>[];
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { error: "Tom CSV sendt inn." },
          { status: 400 }
        );
      }
      const csvText = Object.keys(rows[0]).join(";") + "\n" +
        rows.map((r) => Object.values(r).join(";")).join("\n");
      transactionText = parseCSV(csvText);
    } else if (body.inputType === "pdf") {
      const base64 = body.data as string;
      const buffer = Buffer.from(base64, "base64");
      transactionText = await parsePDF(buffer);
    } else {
      return NextResponse.json(
        { error: "Ugyldig inputType. Bruk 'text', 'csv' eller 'pdf'." },
        { status: 400 }
      );
    }
  } catch (parseError) {
    const message =
      parseError instanceof Error
        ? parseError.message
        : "Parsing-feil";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  try {
    const result = await analyzeTransactions(transactionText);
    // Fire-and-forget: increment report counter. Never block the response on this.
    kv.incr("stats:reports_generated").catch(() => undefined);
    return NextResponse.json(result);
  } catch (claudeError) {
    if (claudeError instanceof Error) {
      const msg = claudeError.message;
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
        return NextResponse.json(
          {
            error:
              "For mange forespørsler. Vent litt og prøv igjen.",
          },
          { status: 429 }
        );
      }
      if (
        msg.toLowerCase().includes("timeout") ||
        msg.toLowerCase().includes("timed out")
      ) {
        return NextResponse.json(
          { error: "Analysen tok for lang tid. Prøv med kortere data." },
          { status: 504 }
        );
      }
    }
    return NextResponse.json(
      { error: "Analyse feilet. Prøv igjen." },
      { status: 500 }
    );
  }
}

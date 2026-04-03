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

interface AccountEntry {
  type: "lønnskonto" | "brukskonto" | "sparekonto";
  inputType: "text" | "csv" | "pdf";
  data: string;
}

interface MultiAccountRequest {
  accounts: AccountEntry[];
}

type AnalyzeRequest = TextInput | CSVInput | PDFInput;

const VALID_ACCOUNT_TYPES = new Set(["lønnskonto", "brukskonto", "sparekonto"]);
const VALID_INPUT_TYPES = new Set(["text", "csv", "pdf"]);
const MAX_ACCOUNT_TEXT_CHARS = 10000;
const MAX_PDF_BASE64_BYTES = 6.7 * 1024 * 1024; // ~5MB binary

export async function POST(request: NextRequest) {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ugyldig forespørsel. Forventet JSON." },
      { status: 400 }
    );
  }

  // Multi-account path
  if (
    typeof rawBody === "object" &&
    rawBody !== null &&
    "accounts" in rawBody &&
    Array.isArray((rawBody as { accounts: unknown }).accounts)
  ) {
    const multiBody = rawBody as MultiAccountRequest;
    const accounts = multiBody.accounts;

    if (accounts.length === 0 || accounts.length > 3) {
      return NextResponse.json(
        { error: "Antall kontoer må være mellom 1 og 3." },
        { status: 400 }
      );
    }

    for (const account of accounts) {
      if (!VALID_ACCOUNT_TYPES.has(account.type)) {
        return NextResponse.json(
          { error: "Ugyldig kontotype. Bruk 'lønnskonto', 'brukskonto' eller 'sparekonto'." },
          { status: 400 }
        );
      }
      if (!VALID_INPUT_TYPES.has(account.inputType)) {
        return NextResponse.json(
          { error: "Ugyldig inputType. Bruk 'text', 'csv' eller 'pdf'." },
          { status: 400 }
        );
      }
      if (!account.data || !account.data.trim()) {
        return NextResponse.json(
          { error: "En konto mangler data." },
          { status: 400 }
        );
      }
      if (account.inputType === "pdf" && account.data.length > MAX_PDF_BASE64_BYTES) {
        return NextResponse.json(
          { error: "En PDF-fil er for stor. Maks 5 MB." },
          { status: 400 }
        );
      }
    }

    try {
      const sections: string[] = [];
      for (const account of accounts) {
        let parsed: string;
        if (account.inputType === "text") {
          parsed = account.data.trim().slice(0, MAX_ACCOUNT_TEXT_CHARS);
        } else if (account.inputType === "csv") {
          parsed = parseCSV(account.data).slice(0, MAX_ACCOUNT_TEXT_CHARS);
        } else {
          const buffer = Buffer.from(account.data, "base64");
          parsed = (await parsePDF(buffer)).slice(0, MAX_ACCOUNT_TEXT_CHARS);
        }
        sections.push(`[Konto: ${account.type}]\n${parsed}`);
      }
      const transactionText = sections.join("\n\n---\n\n");

      const result = await analyzeTransactions(transactionText);
      kv.incr("stats:reports_generated").catch(() => undefined);
      return NextResponse.json(result);
    } catch (err) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
          return NextResponse.json(
            { error: "For mange forespørsler. Vent litt og prøv igjen." },
            { status: 429 }
          );
        }
        if (msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("timed out")) {
          return NextResponse.json(
            { error: "Analysen tok for lang tid. Prøv med kortere data." },
            { status: 504 }
          );
        }
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      return NextResponse.json({ error: "Analyse feilet. Prøv igjen." }, { status: 500 });
    }
  }

  // Single-account path (unchanged — backward compatible)
  const body = rawBody as AnalyzeRequest;

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

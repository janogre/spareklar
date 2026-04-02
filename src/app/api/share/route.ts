import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";
import type { AnalysisResult } from "@/lib/claude";

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB — generous for any real report
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: Request) {
  // Guard against oversized payloads before parsing
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return Response.json(
      { error: "Forespørselen er for stor." },
      { status: 413 }
    );
  }

  let result: AnalysisResult;
  try {
    const text = await req.text();
    if (text.length > MAX_PAYLOAD_BYTES) {
      return Response.json(
        { error: "Forespørselen er for stor." },
        { status: 413 }
      );
    }
    result = JSON.parse(text) as AnalysisResult;
  } catch {
    return Response.json(
      { error: "Ugyldig JSON i forespørselen." },
      { status: 400 }
    );
  }

  // Basic shape validation — refuse obviously malformed payloads
  if (
    typeof result?.totalEstimatedSavingsNOK !== "number" ||
    !Array.isArray(result?.recommendations)
  ) {
    return Response.json(
      { error: "Ugyldig rapport-format." },
      { status: 400 }
    );
  }

  const token = nanoid(8);
  const key = `report:${token}`;

  try {
    await kv.set(key, { result, createdAt: new Date().toISOString() }, {
      ex: TTL_SECONDS,
    });
  } catch {
    return Response.json(
      { error: "Deling er ikke tilgjengelig akkurat nå." },
      { status: 503 }
    );
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const shareUrl = `${base}/r/${token}`;
  return Response.json({ token, shareUrl });
}

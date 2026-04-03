import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { kv } from "@/lib/kv";
import { buildEmailHtml } from "@/lib/email-template";
import type { AnalysisResult } from "@/lib/claude";

export const maxDuration = 30;

// Same regex used by /r/[token] page — only allow nanoid(8) tokens
const VALID_TOKEN = /^[A-Za-z0-9_-]{8}$/;

// RFC 5322-inspired lightweight email check (no ReDos risk)
const VALID_EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

interface StoredReport {
  result: AnalysisResult;
  createdAt: string;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, token, result: inlineResult, consent } = body as Record<string, unknown>;

  // Consent must be explicitly true (boolean), not just truthy
  if (consent !== true) {
    return NextResponse.json({ error: "consent required" }, { status: 400 });
  }

  // Email validation
  if (typeof email !== "string" || !VALID_EMAIL.test(email) || email.length > 320) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  let report: AnalysisResult;

  if (typeof token === "string") {
    // Token-based lookup — validate before using as Redis key
    if (!VALID_TOKEN.test(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    let stored: StoredReport | null;
    try {
      stored = await kv.get<StoredReport>(`report:${token}`);
    } catch {
      return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
    }
    if (!stored) {
      return NextResponse.json({ error: "Rapport ikke funnet eller utløpt" }, { status: 404 });
    }
    report = stored.result;
  } else if (inlineResult !== undefined) {
    // Inline result — validate shape before passing to the email template.
    // Even though the template escapes all output, we enforce types here so
    // crafted payloads (e.g. non-string action, non-number savings) don't cause
    // unexpected behaviour or bypass the type-contract relied on by esc().
    const r = inlineResult as Record<string, unknown>;
    if (
      typeof r.totalEstimatedSavingsNOK !== "number" ||
      !Array.isArray(r.recommendations) ||
      !Array.isArray(r.positives) ||
      r.recommendations.some(
        (rec: unknown) =>
          typeof rec !== "object" ||
          rec === null ||
          typeof (rec as Record<string, unknown>).action !== "string" ||
          typeof (rec as Record<string, unknown>).reason !== "string" ||
          typeof (rec as Record<string, unknown>).estimatedSavingsNOK !== "number" ||
          !Array.isArray((rec as Record<string, unknown>).specific_transactions)
      ) ||
      r.positives.some((p: unknown) => typeof p !== "string")
    ) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
    }
    report = r as unknown as AnalysisResult;
  } else {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
  }

  const resend = new Resend(apiKey);
  const html = buildEmailHtml(report);

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Din sparerapport — ${report.totalEstimatedSavingsNOK.toLocaleString("nb-NO")} kr/år å spare`,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Sending feilet, prøv igjen" }, { status: 500 });
  }

  // Optionally add to Resend audience for re-engagement
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId) {
    // Fire-and-forget — a failure here must not fail the request
    resend.contacts.create({ email, audienceId }).catch(() => undefined);
  }

  return NextResponse.json({ success: true });
}

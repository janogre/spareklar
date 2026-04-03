"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/claude";

interface Props {
  // Provide a share token (from /r/[token] page) OR the full result object.
  // One of them is required.
  token?: string;
  result?: AnalysisResult;
}

export default function EmailCapture({ token, result }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isValidEmail = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(email);
  const canSubmit = isValidEmail && consent && status !== "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const body = token
        ? { email, token, consent }
        : { email, result, consent };

      const res = await fetch("/api/email-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          (data as { error?: string }).error ?? "Sending feilet, prøv igjen"
        );
        setStatus("error");
      }
    } catch {
      setErrorMsg("Nettverksfeil, prøv igjen");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-100 p-6 text-center">
        <svg
          className="w-8 h-8 text-green-500 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-green-800 font-semibold text-sm">
          Rapporten er sendt til {email} ✓
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-0.5">
          Send rapporten på e-post
        </h3>
        <p className="text-sm text-gray-500">
          Ingen konto, gratis — rapporten kommer rett i innboksen din.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@epost.no"
            autoComplete="email"
            required
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="sm:flex-shrink-0 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {status === "loading" ? "Sender…" : "Send rapport"}
          </button>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            Jeg samtykker til å motta rapporten og minner om sparing fra Spareklar.
            Du kan melde deg av når som helst.
          </span>
        </label>

        {status === "error" && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}
      </form>
    </div>
  );
}

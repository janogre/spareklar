"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";
import type { AnalysisResult } from "@/lib/claude";

interface Props {
  result: AnalysisResult;
}

export default function ShareCard({ result }: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const topRec = result.recommendations[0];

  async function getOrCreateShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) {
        setError("Deling er ikke tilgjengelig akkurat nå.");
        return null;
      }
      const data = (await res.json()) as { shareUrl: string };
      setShareUrl(data.shareUrl);
      return data.shareUrl;
    } catch {
      setError("Deling er ikke tilgjengelig akkurat nå.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleWhatsApp() {
    const url = await getOrCreateShareUrl();
    if (!url) return;
    track("share_action", { method: "whatsapp" });
    window.open(
      "whatsapp://send?text=" + encodeURIComponent(url),
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function handleCopyLink() {
    const url = await getOrCreateShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("share_action", { method: "copy_link" });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Kunne ikke kopiere lenken. Prøv igjen.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Shareable summary card */}
      <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-2">
          spareklar.no
        </p>
        <p className="text-3xl font-extrabold text-gray-900 mb-1">
          {result.totalEstimatedSavingsNOK.toLocaleString("nb-NO")} kr
        </p>
        <p className="text-sm text-gray-500 mb-4">potensielle besparelser per år</p>
        {topRec && (
          <div className="bg-white rounded-xl border border-blue-100 px-4 py-3 text-left">
            <p className="text-xs text-gray-400 mb-0.5">Beste råd</p>
            <p className="text-sm font-semibold text-gray-800">{topRec.action}</p>
          </div>
        )}
      </div>

      {/* Share buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleWhatsApp}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1fba58] text-white font-medium py-3 px-4 text-sm transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.094.538 4.064 1.48 5.779L0 24l6.395-1.677C8.063 23.368 10.001 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.52-5.18-1.428l-.371-.22-3.796.996.996-3.676-.242-.382C2.523 15.65 2 13.891 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          {loading ? "Laster…" : "Del via WhatsApp"}
        </button>

        <button
          onClick={handleCopyLink}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 text-sm transition-colors disabled:opacity-50"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Kopiert!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {loading ? "Laster…" : "Kopier lenke"}
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

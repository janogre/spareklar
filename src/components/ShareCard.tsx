"use client";

import { useRef, useState } from "react";
import { track } from "@vercel/analytics";
import type { AnalysisResult } from "@/lib/claude";

interface Props {
  result: AnalysisResult;
}

export default function ShareCard({ result }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const topRec = result.recommendations[0];

  async function handleShare() {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "spareklar-rapport.png";
      link.click();
      track("share_action", { method: "copy_link" });
    } catch {
      // Silently fail — share is best-effort
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Shareable card (rendered to PNG) */}
      <div
        ref={cardRef}
        className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 text-center shadow-sm"
        aria-hidden="true"
      >
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

      <button
        onClick={handleShare}
        disabled={capturing}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-5 text-sm transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {capturing ? "Lager bilde…" : "Last ned som bilde"}
      </button>
    </div>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/lib/claude";
import SpareRapport from "@/components/SpareRapport";
import LoadingState from "@/components/LoadingState";

export default function RapportPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("spareRapport");
      if (!stored) {
        setError("Ingen rapport funnet. Start en ny analyse.");
        return;
      }
      const parsed = JSON.parse(stored) as AnalysisResult;
      setResult(parsed);
    } catch {
      setError("Rapporten kunne ikke lastes. Start en ny analyse.");
    }
  }, []);

  if (error) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Start ny analyse
        </button>
      </div>
    );
  }

  if (!result) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Ny analyse
      </button>
      <SpareRapport result={result} />
    </div>
  );
}

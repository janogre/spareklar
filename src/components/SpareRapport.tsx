"use client";

import type { AnalysisResult } from "@/lib/claude";
import RecommendationCard from "./RecommendationCard";
import ShareCard from "./ShareCard";
import PrivacyBadge from "./PrivacyBadge";

interface Props {
  result: AnalysisResult;
}

export default function SpareRapport({ result }: Props) {
  return (
    <div className="w-full space-y-8">
      {/* Summary header */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-500 mb-2">
          Din Sparerapport
        </p>
        <p className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-1">
          {result.totalEstimatedSavingsNOK.toLocaleString("nb-NO")} kr
        </p>
        <p className="text-gray-500">potensielle besparelser per år</p>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Anbefalinger</h2>
        {result.recommendations.map((rec) => (
          <RecommendationCard key={rec.rank} recommendation={rec} />
        ))}
      </div>

      {/* Positives */}
      {result.positives.length > 0 && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-5">
          <h2 className="text-base font-bold text-green-800 mb-3">
            Hva du gjør bra
          </h2>
          <ul className="space-y-2">
            {result.positives.map((positive, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {positive}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Share card */}
      <ShareCard result={result} />

      {/* Privacy badge */}
      <div className="flex justify-center">
        <PrivacyBadge />
      </div>
    </div>
  );
}

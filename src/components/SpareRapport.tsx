"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { AnalysisResult } from "@/lib/claude";
import RecommendationCard from "./RecommendationCard";
import ShareCard from "./ShareCard";
import EmailCapture from "./EmailCapture";
import PrivacyBadge from "./PrivacyBadge";

const ExpenseChart = dynamic(() => import("./ExpenseChart"), { ssr: false });

interface Props {
  result: AnalysisResult;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startedAt = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startedAt.current === null) startedAt.current = timestamp;
      const elapsed = timestamp - startedAt.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export default function SpareRapport({ result }: Props) {
  const animatedSavings = useCountUp(result.totalEstimatedSavingsNOK);

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Summary header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Din Sparerapport
        </div>

        {/* Accent bar above number */}
        <div className="flex justify-center">
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
        </div>

        <p className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight animate-count-up tabular-nums">
          {animatedSavings.toLocaleString("nb-NO")} kr
        </p>
        <p className="text-gray-500 text-base">potensielle besparelser per år</p>
      </div>

      {/* Expense breakdown chart */}
      {result.spendingBreakdown && result.spendingBreakdown.length > 0 && (
        <ExpenseChart
          data={result.spendingBreakdown}
          totalMonthlySpendNOK={result.totalMonthlySpendNOK ?? 0}
        />
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Anbefalinger</h2>
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">{result.recommendations.length} tips</span>
        </div>
        {result.recommendations.map((rec) => (
          <RecommendationCard key={rec.rank} recommendation={rec} />
        ))}
      </div>

      {/* Positives */}
      {result.positives.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Hva du gjør bra</h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
            <ul className="space-y-2.5">
              {result.positives.map((positive, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-green-700">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {positive}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* No change needed */}
      {result.no_change_needed?.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Dette trenger du ikke endre</h2>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
            <ul className="space-y-2.5">
              {result.no_change_needed.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-blue-700">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Share card */}
      <ShareCard result={result} />

      {/* Email capture */}
      <EmailCapture result={result} />

      {/* Privacy badge */}
      <div className="flex justify-center">
        <PrivacyBadge />
      </div>
    </div>
  );
}

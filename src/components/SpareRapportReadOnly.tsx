import dynamic from "next/dynamic";
import type { AnalysisResult } from "@/lib/claude";
import RecommendationCard from "./RecommendationCard";
import EmailCapture from "./EmailCapture";
import PrivacyBadge from "./PrivacyBadge";
import Link from "next/link";

const ExpenseChart = dynamic(() => import("./ExpenseChart"), { ssr: false });

interface Props {
  result: AnalysisResult;
  token?: string;
}

// Read-only variant of SpareRapport used for shared /r/[token] pages.
// Does NOT include ShareCard to avoid circular share generation.
export default function SpareRapportReadOnly({ result, token }: Props) {
  return (
    <div className="w-full space-y-8">
      {/* Summary header */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-500 mb-2">
          Sparerapport fra Spareklar
        </p>
        <p className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-1">
          {result.totalEstimatedSavingsNOK.toLocaleString("nb-NO")} kr
        </p>
        <p className="text-gray-500">potensielle besparelser per år</p>
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

      {/* No change needed */}
      {result.no_change_needed?.length > 0 && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5">
          <h2 className="text-base font-bold text-blue-800 mb-3">
            Dette trenger du ikke endre
          </h2>
          <ul className="space-y-2">
            {result.no_change_needed.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Email capture */}
      <EmailCapture token={token} result={token ? undefined : result} />

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Lag din egen gratis rapport
        </Link>
      </div>

      {/* Privacy badge */}
      <div className="flex justify-center">
        <PrivacyBadge />
      </div>
    </div>
  );
}

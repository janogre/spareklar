"use client";

import { track } from "@vercel/analytics";
import type { Recommendation } from "@/lib/claude";
import { getAffiliate } from "@/lib/affiliates";

interface Props {
  recommendation: Recommendation;
}

const CATEGORY_LABELS: Record<string, string> = {
  electricity: "Strøm",
  loans: "Lån",
  mobile: "Mobil/Bredbånd",
  insurance: "Forsikring",
  subscriptions: "Abonnementer",
  savings: "Sparing",
  credit_card: "Kredittkort",
  food: "Mat",
  other: "Annet",
};

const CATEGORY_COLORS: Record<string, string> = {
  electricity: "bg-yellow-50 border-yellow-200 text-yellow-700",
  loans: "bg-blue-50 border-blue-200 text-blue-700",
  mobile: "bg-purple-50 border-purple-200 text-purple-700",
  insurance: "bg-green-50 border-green-200 text-green-700",
  subscriptions: "bg-pink-50 border-pink-200 text-pink-700",
  savings: "bg-emerald-50 border-emerald-200 text-emerald-700",
  credit_card: "bg-orange-50 border-orange-200 text-orange-700",
  food: "bg-lime-50 border-lime-200 text-lime-700",
  other: "bg-gray-50 border-gray-200 text-gray-700",
};

const CATEGORY_BORDER: Record<string, string> = {
  electricity: "border-l-yellow-400",
  loans: "border-l-blue-500",
  mobile: "border-l-purple-500",
  insurance: "border-l-green-500",
  subscriptions: "border-l-pink-400",
  savings: "border-l-emerald-500",
  credit_card: "border-l-orange-400",
  food: "border-l-lime-500",
  other: "border-l-gray-300",
};

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "electricity":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case "loans":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "mobile":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case "insurance":
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
  }
}

export default function RecommendationCard({ recommendation }: Props) {
  const affiliate = getAffiliate(recommendation.affiliateKey);
  const categoryLabel =
    CATEGORY_LABELS[recommendation.category] ?? recommendation.category;
  const colorClass =
    CATEGORY_COLORS[recommendation.category] ?? CATEGORY_COLORS.other;
  const borderClass =
    CATEGORY_BORDER[recommendation.category] ?? CATEGORY_BORDER.other;

  return (
    <div className={`rounded-2xl border border-gray-200 border-l-4 ${borderClass} bg-white p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {/* Rank badge */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {recommendation.rank}
          </span>
          {/* Category badge with icon */}
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
            <CategoryIcon category={recommendation.category} />
            {categoryLabel}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-extrabold text-green-600">
            {recommendation.estimatedSavingsNOK.toLocaleString("nb-NO")} kr
          </p>
          <p className="text-xs text-gray-400">per år</p>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1.5 text-sm sm:text-base leading-snug">
        {recommendation.action}
      </h3>
      <p className={`text-sm text-gray-500 leading-relaxed ${recommendation.specific_transactions?.length > 0 ? "mb-2" : "mb-4"}`}>
        {recommendation.reason}
      </p>
      {recommendation.specific_transactions?.length > 0 && (
        <ul className="text-sm text-gray-500 mt-1 mb-4 list-disc list-inside space-y-0.5">
          {recommendation.specific_transactions.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}

      {affiliate && (
        <a
          href={affiliate.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors shadow-sm hover:shadow-md"
          onClick={() => {
            track("affiliate_click", {
              category: recommendation.affiliateKey,
              partner: affiliate.partnerName,
            });
          }}
        >
          {affiliate.cta}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}

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
  other: "Annet",
};

const CATEGORY_COLORS: Record<string, string> = {
  electricity: "bg-yellow-50 border-yellow-200 text-yellow-700",
  loans: "bg-blue-50 border-blue-200 text-blue-700",
  mobile: "bg-purple-50 border-purple-200 text-purple-700",
  insurance: "bg-green-50 border-green-200 text-green-700",
  other: "bg-gray-50 border-gray-200 text-gray-700",
};

export default function RecommendationCard({ recommendation }: Props) {
  const affiliate = getAffiliate(recommendation.affiliateKey);
  const categoryLabel =
    CATEGORY_LABELS[recommendation.category] ?? recommendation.category;
  const colorClass =
    CATEGORY_COLORS[recommendation.category] ?? CATEGORY_COLORS.other;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
            {recommendation.rank}
          </span>
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
          >
            {categoryLabel}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-green-600">
            {recommendation.estimatedSavingsNOK.toLocaleString("nb-NO")} kr
          </p>
          <p className="text-xs text-gray-400">per år</p>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
        {recommendation.action}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{recommendation.reason}</p>

      {affiliate && (
        <a
          href={affiliate.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
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

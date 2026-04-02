const MIN_COUNT_TO_SHOW = 50;

interface Props {
  count: number;
}

export default function TrustBadge({ count }: Props) {
  if (count < MIN_COUNT_TO_SHOW) return null;

  const formatted = count.toLocaleString("nb-NO");

  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
        {formatted} rapporter generert
      </div>
    </div>
  );
}

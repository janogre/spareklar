import { kv } from "@vercel/kv";
import Link from "next/link";
import type { Metadata } from "next";
import type { AnalysisResult } from "@/lib/claude";
import SpareRapportReadOnly from "@/components/SpareRapportReadOnly";

interface StoredReport {
  result: AnalysisResult;
  createdAt: string;
}

interface PageProps {
  params: { token: string };
}

// Only allow tokens produced by nanoid(8) — alphanumeric + _ and -
const VALID_TOKEN = /^[A-Za-z0-9_-]{8}$/;

async function getReport(token: string): Promise<StoredReport | null> {
  if (!VALID_TOKEN.test(token)) return null;
  try {
    return await kv.get<StoredReport>(`report:${token}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getReport(params.token);
  if (!data) {
    return { title: "Rapport ikke funnet — Spareklar" };
  }

  const savings = data.result.totalEstimatedSavingsNOK;
  const savingsFormatted =
    typeof savings === "number" ? savings.toLocaleString("nb-NO") : "?";

  return {
    title: `Jeg kan spare ${savingsFormatted} kr/år!`,
    description: "Se min personlige sparerapport fra Spareklar",
    openGraph: {
      title: `Spar ${savingsFormatted} kr/år med Spareklar`,
      description: "Gratis, personlig analyse av dine bankutgifter",
      type: "website",
    },
  };
}

export default async function SharedRapportPage({ params }: PageProps) {
  const data = await getReport(params.token);

  if (!data) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="text-gray-600">
          Denne rapporten er utløpt eller finnes ikke.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Lag din egen rapport
        </Link>
      </div>
    );
  }

  return <SpareRapportReadOnly result={data.result} />;
}

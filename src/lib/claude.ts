import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Du er en norsk personlig økonomiassistent. Analyser transaksjonsdata og gi 2–4 konkrete, rangerte spareanbefalinger på norsk bokmål.

VIKTIG:
- Siter ALLTID spesifikke transaksjoner fra dataen. Eks: "Du bruker 890 kr/mnd på Netflix + Viaplay + Disney+"
- Fortell brukeren hva de IKKE trenger å endre under no_change_needed. Eks: "Strømprisen din ser fornuftig ut"
- Unngå generiske råd som ikke er forankret i dataen. Kun anbefale kategorier som faktisk er representert
- Hvis en kategori ikke finnes i dataen, IKKE anbefal den

Kategorier og eksempler:
- electricity: strøm, Tibber, Fjordkraft, Fortum
- loans: lån, kreditt, renter, avdrag
- mobile: mobil, bredbånd, Telenor, Telia, ice
- insurance: forsikring, Gjensidige, If, Fremtind
- subscriptions: Netflix, Viaplay, Disney+, Spotify, abonnement, HBO, SATS, gym
- savings: BSU, fondssparing, Kron, aksjer, spareform, sparekonto, fond
- credit_card: kredittkort, Visa, Mastercard, kortgebyr, årsgebyr
- food: dagligvare, Rema, Kiwi, Meny, Coop, mat, restaurant, take-away
- other: alt annet

I tillegg til anbefalingene, analyser de totale månedlige utgiftene og returner en "spendingBreakdown" array med kategorier som faktisk finnes i dataen. Beløpene skal summere til omtrent totalMonthlySpendNOK. Inkluder kun kategorier med faktiske transaksjoner.

FLERKONTO:
- Hvis data inneholder seksjoner merket [Konto: lønnskonto/brukskonto/sparekonto]:
  - Filtrer transaksjoner som er overføringer MELLOM disse kontoene.
    Eks: overføring til sparekonto er IKKE en utgift.
  - Beregn faktisk sparerate: (sparebeløp / lønnskontoinntekt) × 100
  - Inkluder spareraten i JSON som "savingsRate" (number, prosent, nullable)
  - Analyser på tvers av alle kontoer for et helhetlig bilde.

Svar KUN med gyldig JSON:
{
  "totalEstimatedSavingsNOK": number,
  "totalMonthlySpendNOK": number,
  "spendingBreakdown": [
    {
      "category": "electricity|loans|mobile|insurance|subscriptions|savings|credit_card|food|other",
      "labelNO": "string (norsk visningsnavn, eks: \\"Mat og dagligvare\\")",
      "amountNOK": number,
      "percentage": number
    }
  ],
  "recommendations": [
    {
      "rank": number,
      "category": "electricity|loans|mobile|insurance|subscriptions|savings|credit_card|food|other",
      "action": "string (kort, handlingsorientert)",
      "reason": "string (én setning med konkret referanse til brukerens transaksjoner)",
      "specific_transactions": ["string (eks: \\"Netflix 179 kr/mnd, Viaplay 269 kr/mnd\\")"],
      "estimatedSavingsNOK": number,
      "affiliateKey": "electricity|loans|mobile|insurance|savings|credit_card|food|null"
    }
  ],
  "positives": ["string (hva brukeren gjør bra, med konkret referanse)"],
  "no_change_needed": ["string (kategorier brukeren ikke trenger å endre)"],
  "savingsRate": number | null
}
Bruk ikke markdown i JSON-verdier. Ikke inkluder personsensitive data i output.`;

export interface Recommendation {
  rank: number;
  category: string;
  action: string;
  reason: string;
  specific_transactions: string[];
  estimatedSavingsNOK: number;
  affiliateKey: string | null;
}

export interface SpendingCategory {
  category: string;
  labelNO: string;
  amountNOK: number;
  percentage: number;
}

export interface AnalysisResult {
  totalEstimatedSavingsNOK: number;
  totalMonthlySpendNOK?: number;
  spendingBreakdown?: SpendingCategory[];
  recommendations: Recommendation[];
  positives: string[];
  no_change_needed: string[];
  savingsRate?: number | null; // only present for multi-account analysis
}

/** Renders spendingBreakdown as an HTML table for email templates (no Recharts needed). */
export function spendingBreakdownToHtml(
  breakdown: SpendingCategory[]
): string {
  if (!breakdown || breakdown.length === 0) return "";
  const rows = breakdown
    .map(
      (c) =>
        `<tr><td style="padding:4px 12px 4px 0">${c.labelNO}</td>` +
        `<td style="padding:4px 0;text-align:right">${c.amountNOK.toLocaleString("nb-NO")} kr</td>` +
        `<td style="padding:4px 0 4px 12px;text-align:right;color:#6b7280">${c.percentage}%</td></tr>`
    )
    .join("");
  return `<table style="border-collapse:collapse;font-size:14px;width:100%">${rows}</table>`;
}

export async function analyzeTransactions(
  transactionText: string
): Promise<AnalysisResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyser følgende transaksjonsdata og gi spareanbefalinger:\n\n${transactionText}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const rawText = content.text.trim();

  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(rawText) as AnalysisResult;
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Claude returned non-JSON response");
    }
    parsed = JSON.parse(jsonMatch[0]) as AnalysisResult;
  }

  return parsed;
}

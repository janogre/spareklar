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

Svar KUN med gyldig JSON:
{
  "totalEstimatedSavingsNOK": number,
  "recommendations": [
    {
      "rank": number,
      "category": "electricity|loans|mobile|insurance|other",
      "action": "string (kort, handlingsorientert)",
      "reason": "string (én setning med konkret referanse til brukerens transaksjoner)",
      "specific_transactions": ["string (eks: \\"Netflix 179 kr/mnd, Viaplay 269 kr/mnd\\")"],
      "estimatedSavingsNOK": number,
      "affiliateKey": "electricity|loans|mobile|insurance|null"
    }
  ],
  "positives": ["string (hva brukeren gjør bra, med konkret referanse)"],
  "no_change_needed": ["string (kategorier brukeren ikke trenger å endre)"]
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
  labelNO?: string;
  amountNOK: number;
  percentage: number;
}

export interface AnalysisResult {
  totalEstimatedSavingsNOK: number;
  recommendations: Recommendation[];
  positives: string[];
  no_change_needed: string[];
  // Added in 2.3 — optional for backwards compatibility
  spendingBreakdown?: SpendingCategory[];
  totalMonthlySpendNOK?: number;
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

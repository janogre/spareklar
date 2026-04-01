import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Du er en norsk personlig økonomiassistent. Analyser transaksjonsdata og gi 2–4 konkrete, rangerte spareanbefalinger på norsk bokmål. Svar KUN med gyldig JSON i dette formatet:
{
  "totalEstimatedSavingsNOK": number,
  "recommendations": [
    {
      "rank": number,
      "category": "electricity|loans|mobile|insurance|other",
      "action": "string (kort, handlingsorientert)",
      "reason": "string (én setning, ikke-dømmende)",
      "estimatedSavingsNOK": number,
      "affiliateKey": "electricity|loans|mobile|insurance|null"
    }
  ],
  "positives": ["string", "string"]
}
Bruk ikke markdown i JSON-verdier. Ikke inkluder personsensitive data i output.`;

export interface Recommendation {
  rank: number;
  category: string;
  action: string;
  reason: string;
  estimatedSavingsNOK: number;
  affiliateKey: string | null;
}

export interface AnalysisResult {
  totalEstimatedSavingsNOK: number;
  recommendations: Recommendation[];
  positives: string[];
}

export async function analyzeTransactions(
  transactionText: string
): Promise<AnalysisResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
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

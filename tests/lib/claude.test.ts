import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AnalysisResult } from "@/lib/claude";

// Mock @anthropic-ai/sdk before importing claude
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor(_opts?: unknown) {}
    },
  };
});

const MOCK_RESULT: AnalysisResult = {
  totalEstimatedSavingsNOK: 4800,
  recommendations: [
    {
      rank: 1,
      category: "electricity",
      action: "Bytt til Tibber",
      reason: "Du bruker mer strøm enn gjennomsnittet.",
      specific_transactions: ["Fjordkraft 1 200 kr/mnd"],
      estimatedSavingsNOK: 2400,
      affiliateKey: "electricity",
    },
    {
      rank: 2,
      category: "loans",
      action: "Refinansier lånet ditt",
      reason: "Renten er høyere enn markedssnittet.",
      specific_transactions: ["Santander 2 800 kr/mnd"],
      estimatedSavingsNOK: 1800,
      affiliateKey: "loans",
    },
  ],
  positives: ["Du sparer jevnlig – bra!", "Matbudsjettet er godt kontrollert."],
  no_change_needed: ["Forsikringene dine ser fornuftige ut"],
};

function makeClaudeResponse(text: string) {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: "claude-sonnet-4-6",
    stop_reason: "end_turn",
    usage: { input_tokens: 100, output_tokens: 200 },
  };
}

describe("analyzeTransactions", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns structured AnalysisResult from valid Claude JSON response", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    const result = await analyzeTransactions("strøm 1200kr, lån 2800kr");

    expect(result).toMatchObject({
      totalEstimatedSavingsNOK: 4800,
      recommendations: expect.any(Array),
      positives: expect.any(Array),
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("each recommendation has required fields", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    const result = await analyzeTransactions("transaksjoner");

    for (const rec of result.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("action");
      expect(rec).toHaveProperty("reason");
      expect(rec).toHaveProperty("estimatedSavingsNOK");
      expect(typeof rec.rank).toBe("number");
      expect(typeof rec.action).toBe("string");
    }
  });

  it("affiliateKey values are valid enum values or null", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    const result = await analyzeTransactions("transaksjoner");

    const validKeys = ["electricity", "loans", "mobile", "insurance", "other", null];
    for (const rec of result.recommendations) {
      expect(validKeys).toContain(rec.affiliateKey);
    }
  });

  it("handles Claude response wrapped in JSON code fence", async () => {
    const wrapped = "```json\n" + JSON.stringify(MOCK_RESULT) + "\n```";
    mockCreate.mockResolvedValueOnce(makeClaudeResponse(wrapped));

    const { analyzeTransactions } = await import("@/lib/claude");
    const result = await analyzeTransactions("transaksjoner");

    // Should extract JSON from fence and parse it
    expect(result).toHaveProperty("totalEstimatedSavingsNOK");
  });

  it("throws error when Claude returns non-JSON text", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse("Beklager, jeg kan ikke hjelpe med dette.")
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    await expect(analyzeTransactions("transaksjoner")).rejects.toThrow();
  });

  it("sends Norwegian prompt to Claude API", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    await analyzeTransactions("mine transaksjoner her");

    const callArgs = mockCreate.mock.calls[0][0];
    // System prompt should be in Norwegian
    expect(callArgs.system).toMatch(/norsk/i);
    // User message should reference the input
    const userMsg = callArgs.messages[0].content;
    expect(userMsg).toContain("mine transaksjoner her");
  });

  it("uses claude-sonnet-4-6 model", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    await analyzeTransactions("transaksjoner");

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-6");
  });

  it("instructs Claude to return JSON-only (no PII)", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    await analyzeTransactions("transaksjoner");

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toMatch(/json/i);
    expect(callArgs.system).toMatch(/personsensitive/i);
  });

  it("returns specific_transactions per recommendation", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    const result = await analyzeTransactions("transaksjoner");

    for (const rec of result.recommendations) {
      expect(rec).toHaveProperty("specific_transactions");
      expect(Array.isArray(rec.specific_transactions)).toBe(true);
    }
    expect(result.recommendations[0].specific_transactions).toContain("Fjordkraft 1 200 kr/mnd");
  });

  it("returns no_change_needed in result", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    const result = await analyzeTransactions("transaksjoner");

    expect(result).toHaveProperty("no_change_needed");
    expect(Array.isArray(result.no_change_needed)).toBe(true);
    expect(result.no_change_needed).toContain("Forsikringene dine ser fornuftige ut");
  });

  it("system prompt instructs Claude to cite specific transactions", async () => {
    mockCreate.mockResolvedValueOnce(
      makeClaudeResponse(JSON.stringify(MOCK_RESULT))
    );

    const { analyzeTransactions } = await import("@/lib/claude");
    await analyzeTransactions("transaksjoner");

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toMatch(/specific_transactions/i);
    expect(callArgs.system).toMatch(/no_change_needed/i);
  });
});

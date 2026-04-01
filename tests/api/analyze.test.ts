import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import type { AnalysisResult } from "@/lib/claude";

// Mock the Anthropic SDK so integration tests don't make real API calls
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
      estimatedSavingsNOK: 2400,
      affiliateKey: "electricity",
    },
  ],
  positives: ["Du sparer jevnlig – bra!"],
};

function makeClaudeMessage(text: string) {
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

async function callRoute(body: unknown) {
  const { POST } = await import("@/app/api/analyze/route");
  const req = new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req as any);
}

describe("POST /api/analyze — text input", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue(
      makeClaudeMessage(JSON.stringify(MOCK_RESULT))
    );
  });

  it("returns 200 with valid response shape for text input", async () => {
    const res = await callRoute({
      inputType: "text",
      data: "Betalt Netflix 179kr, Spotify 99kr, Rema 845kr",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("recommendations");
    expect(json).toHaveProperty("totalEstimatedSavingsNOK");
    expect(json).toHaveProperty("positives");
    expect(Array.isArray(json.recommendations)).toBe(true);
  });

  it("recommendations have correct shape", async () => {
    const res = await callRoute({
      inputType: "text",
      data: "strøm 1200kr, telefon 399kr",
    });
    const json = await res.json();
    for (const rec of json.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("action");
      expect(rec).toHaveProperty("reason");
      expect(rec).toHaveProperty("estimatedSavingsNOK");
    }
  });
});

describe("POST /api/analyze — CSV input", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue(
      makeClaudeMessage(JSON.stringify(MOCK_RESULT))
    );
  });

  it("returns 200 with valid response for pre-parsed CSV row array", async () => {
    // CSV is sent as parsed row objects (client-side papaparse → JSON array)
    const csvRows = [
      { Dato: "01.03.2025", Beskrivelse: "Rema 1000", Beloep: "-234.50" },
      { Dato: "02.03.2025", Beskrivelse: "Strom Tibber", Beloep: "-890.00" },
    ];
    const res = await callRoute({ inputType: "csv", data: csvRows });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("recommendations");
  });

  it("returns 400 for empty CSV row array", async () => {
    const res = await callRoute({ inputType: "csv", data: [] });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});

describe("POST /api/analyze — validation", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns 400 when inputType is missing", async () => {
    const res = await callRoute({ data: "some text" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 when data is missing", async () => {
    const res = await callRoute({ inputType: "text" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for empty text data", async () => {
    const res = await callRoute({ inputType: "text", data: "" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for whitespace-only text", async () => {
    const res = await callRoute({ inputType: "text", data: "   " });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 400 for invalid inputType", async () => {
    const res = await callRoute({ inputType: "excel", data: "test" });
    expect(res.status).toBe(400);
  });

  it("error responses contain Norwegian error message", async () => {
    const res = await callRoute({ inputType: "text", data: "" });
    const json = await res.json();
    // Error message should be in Norwegian (not English)
    expect(json.error).toBeDefined();
    // Common Norwegian error words
    const isNorwegian = /tom|mangler|ugyldig|feil|sendt/i.test(json.error);
    expect(isNorwegian, `Error message should be Norwegian: "${json.error}"`).toBe(true);
  });
});

describe("POST /api/analyze — Claude error handling", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns 500 when Claude returns malformed JSON", async () => {
    mockCreate.mockResolvedValue(
      makeClaudeMessage("Dette er ikke JSON. Beklager!")
    );
    const res = await callRoute({
      inputType: "text",
      data: "mine transaksjoner",
    });
    expect([500, 502]).toContain(res.status);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 500 gracefully when Claude throws", async () => {
    mockCreate.mockRejectedValue(new Error("Network error"));
    const res = await callRoute({
      inputType: "text",
      data: "mine transaksjoner",
    });
    expect([500, 502, 503]).toContain(res.status);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 429 when Claude rate-limits", async () => {
    mockCreate.mockRejectedValue(new Error("429 Rate limit exceeded"));
    const res = await callRoute({
      inputType: "text",
      data: "mine transaksjoner",
    });
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});

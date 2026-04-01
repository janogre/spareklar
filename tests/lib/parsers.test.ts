import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseCSV } from "@/lib/parsers";

// Mock pdf-parse — avoid real PDF parsing in unit tests
vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "Strøm 1200kr\nNetflix 179kr" }),
}));

const CSV_WITH_BOM = `\uFEFFDato;Beskrivelse;Beløp
01.03.2025;Rema 1000;-234.50
02.03.2025;Strøm Tibber;-890.00
03.03.2025;Lønn;25000.00`;

const CSV_SEMICOLON = `Dato;Beskrivelse;Beløp
01.03.2025;Netflix;-179.00
05.03.2025;Spotify;-99.00`;

const CSV_COMMA = `Dato,Beskrivelse,Beloep
01.03.2025,Rema 1000,-234.50
02.03.2025,Strom,-890.00`;

const CSV_OVER_200_ROWS = (() => {
  const header = "Dato;Beskrivelse;Beloep";
  const rows = Array.from({ length: 210 }, (_, i) => {
    const day = String((i % 28) + 1).padStart(2, "0");
    return `${day}.03.2025;Handel ${i};-${(i * 10).toFixed(2)}`;
  });
  return [header, ...rows].join("\n");
})();

describe("parseCSV", () => {
  it("strips BOM and returns valid summary string", () => {
    const result = parseCSV(CSV_WITH_BOM);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain("\uFEFF");
    expect(result).toContain("Transaksjoner");
  });

  it("parses semicolon-separated CSV and includes transaction data", () => {
    const result = parseCSV(CSV_SEMICOLON);
    expect(typeof result).toBe("string");
    expect(result).toContain("Netflix");
    expect(result).toContain("Spotify");
  });

  it("parses comma-separated CSV", () => {
    const result = parseCSV(CSV_COMMA);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles empty string input without throwing", () => {
    const result = parseCSV("");
    expect(typeof result).toBe("string");
  });

  it("truncates to max 200 rows for large CSV", () => {
    const result = parseCSV(CSV_OVER_200_ROWS);
    const match = result.match(/Transaksjoner \((\d+) rader\)/);
    if (match) {
      expect(parseInt(match[1], 10)).toBeLessThanOrEqual(200);
    }
    expect(result.length).toBeGreaterThan(0);
  });

  it("output is a structured summary, not raw CSV", () => {
    const result = parseCSV(CSV_SEMICOLON);
    expect(result).not.toBe(CSV_SEMICOLON);
    expect(result).toMatch(/:/); // formatted "key: value" structure
  });
});

describe("parsePDF", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns extracted text string from valid PDF buffer", async () => {
    const { parsePDF } = await import("@/lib/parsers");
    const buffer = Buffer.from("mock pdf data");
    const result = await parsePDF(buffer);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws Norwegian error when PDF contains no extractable text", async () => {
    vi.doMock("pdf-parse", () => ({
      default: vi.fn().mockResolvedValue({ text: "   " }),
    }));
    const { parsePDF } = await import("@/lib/parsers");
    const buffer = Buffer.from("mock pdf data");
    await expect(parsePDF(buffer)).rejects.toThrow(/Kunne ikke lese/i);
  });

  it("truncates output to 12000 chars", async () => {
    const longText = "A".repeat(15000);
    vi.doMock("pdf-parse", () => ({
      default: vi.fn().mockResolvedValue({ text: longText }),
    }));
    const { parsePDF } = await import("@/lib/parsers");
    const buffer = Buffer.from("mock pdf data");
    const result = await parsePDF(buffer);
    expect(result.length).toBeLessThanOrEqual(12000);
  });
});

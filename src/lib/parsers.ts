import Papa from "papaparse";

export interface ParsedTransaction {
  [key: string]: string;
}

/**
 * Parse CSV text (handles BOM and semicolon separators common in Norwegian bank exports).
 * Returns a normalized text summary suitable for Claude.
 */
export function parseCSV(csvText: string): string {
  const cleaned = csvText.replace(/^\uFEFF/, "");

  const hasSemicolon = cleaned.includes(";");
  const result = Papa.parse<ParsedTransaction>(cleaned, {
    header: true,
    delimiter: hasSemicolon ? ";" : ",",
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(
      `CSV-parsing feilet: ${result.errors[0].message}`
    );
  }

  const rows = result.data.slice(0, 200);
  const headers = result.meta.fields ?? [];

  const lines = rows.map((row) =>
    headers.map((h) => `${h}: ${row[h] ?? ""}`).join(", ")
  );

  return `Transaksjoner (${lines.length} rader):\n${lines.join("\n")}`;
}

/**
 * Parse PDF buffer server-side and return extracted text.
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  // pdf-parse is a CommonJS module; dynamic import for ESM compatibility
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  const text = data.text.trim();
  if (!text) {
    throw new Error("Kunne ikke lese tekst fra PDF-filen.");
  }
  return text.slice(0, 12000);
}

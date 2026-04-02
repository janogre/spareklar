"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import Papa from "papaparse";
import PrivacyBadge from "./PrivacyBadge";
import LoadingState from "./LoadingState";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function InputForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputSource, setInputSource] = useState<"text" | "csv" | "pdf">("text");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Lim inn transaksjonsdata eller last opp en fil.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType: "text", data: text }),
      });

      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json();
      track("report_generated", { input_type: inputSource });
      track("input_type", { type: inputSource });
      sessionStorage.setItem("spareRapport", JSON.stringify(result));
      router.push("/rapport");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analyse feilet. Prøv igjen."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCSVFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setError("Filen er for stor. Maks 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      try {
        const cleaned = csvText.replace(/^\uFEFF/, "");
        const hasSemicolon = cleaned.includes(";");
        const result = Papa.parse<Record<string, string>>(cleaned, {
          header: true,
          delimiter: hasSemicolon ? ";" : ",",
          skipEmptyLines: true,
        });
        if (result.data.length === 0) {
          setError("Fant ingen rader i CSV-filen.");
          return;
        }
        const preview = result.data
          .slice(0, 5)
          .map((row) => Object.values(row).join("\t"))
          .join("\n");
        setText(`[CSV-fil: ${file.name}]\n${preview}\n…(${result.data.length} rader totalt)`);
        setInputSource("csv");
        // Store parsed data in state to send on submit
        // We re-parse inline on submit via text path for simplicity
        // For a production app, store result.data and post as csv inputType
      } catch {
        setError("Kunne ikke lese CSV-filen.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function handlePDFFile(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      setError("Filen er for stor. Maks 5 MB.");
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType: "pdf", data: base64 }),
      });

      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json();
      track("report_generated", { input_type: "pdf" });
      track("input_type", { type: "pdf" });
      sessionStorage.setItem("spareRapport", JSON.stringify(result));
      router.push("/rapport");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analyse feilet. Prøv igjen."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      handlePDFFile(file);
    } else if (
      file.type === "text/csv" ||
      file.name.endsWith(".csv") ||
      file.type === "text/plain"
    ) {
      handleCSVFile(file);
    } else {
      setError("Støtter kun CSV- og PDF-filer.");
    }
    e.target.value = "";
  }

  if (loading) return <LoadingState />;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="relative">
        <textarea
          className="w-full min-h-[160px] sm:min-h-[200px] rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y shadow-inner transition-shadow"
          placeholder="Lim inn transaksjoner her (f.eks. fra nettbank) — eller last opp en CSV/PDF-fil nedenfor."
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Transaksjonsdata"
        />
        {text.length > 0 && (
          <div className="absolute bottom-3 right-3 text-xs text-gray-300 select-none">
            {text.length} tegn
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors text-base shadow-sm hover:shadow-md"
        >
          Analyser utgiftene mine
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-600 font-medium py-3 px-5 rounded-xl transition-colors text-sm hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Last opp CSV/PDF
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf,text/csv,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex justify-center pt-1">
        <PrivacyBadge />
      </div>
    </form>
  );
}

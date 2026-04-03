"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import Papa from "papaparse";
import PrivacyBadge from "./PrivacyBadge";
import LoadingState from "./LoadingState";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type AccountLabel = "lønnskonto" | "brukskonto" | "sparekonto";
type SlotInputType = "text" | "csv" | "pdf";

interface AccountSlot {
  id: string;
  label: AccountLabel;
  text: string;    // display text (CSV preview or raw text)
  rawData: string; // actual data to POST (full text / base64 PDF / raw CSV)
  inputType: SlotInputType;
  error: string | null;
}

function freshSlot(label: AccountLabel = "brukskonto"): AccountSlot {
  return {
    id: crypto.randomUUID(),
    label,
    text: "",
    rawData: "",
    inputType: "text",
    error: null,
  };
}

export default function InputForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotIdRef = useRef<string | null>(null);

  const [accounts, setAccounts] = useState<AccountSlot[]>([freshSlot("lønnskonto")]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const slot1HasContent = !!(accounts[0].rawData.trim() || accounts[0].text.trim());
  const canAddAccount = slot1HasContent && accounts.length < 3;

  function updateSlot(id: string, updates: Partial<AccountSlot>) {
    setAccounts((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function removeSlot(id: string) {
    setAccounts((prev) => prev.filter((s) => s.id !== id));
  }

  function addSlot() {
    setAccounts((prev) => [...prev, freshSlot("brukskonto")]);
  }

  function triggerFileUpload(slotId: string) {
    activeSlotIdRef.current = slotId;
    fileInputRef.current?.click();
  }

  function handleCSVFile(file: File, slotId: string) {
    if (file.size > MAX_FILE_SIZE) {
      updateSlot(slotId, { error: "Filen er for stor. Maks 5 MB." });
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
          updateSlot(slotId, { error: "Fant ingen rader i CSV-filen." });
          return;
        }
        const preview = result.data
          .slice(0, 5)
          .map((row) => Object.values(row).join("\t"))
          .join("\n");
        updateSlot(slotId, {
          text: `[CSV-fil: ${file.name}]\n${preview}\n…(${result.data.length} rader totalt)`,
          rawData: csvText,
          inputType: "csv",
          error: null,
        });
      } catch {
        updateSlot(slotId, { error: "Kunne ikke lese CSV-filen." });
      }
    };
    reader.readAsText(file, "utf-8");
  }

  async function handlePDFFile(file: File, slotId: string) {
    if (file.size > MAX_FILE_SIZE) {
      updateSlot(slotId, { error: "Filen er for stor. Maks 5 MB." });
      return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      updateSlot(slotId, {
        text: `[PDF-fil: ${file.name}]`,
        rawData: base64,
        inputType: "pdf",
        error: null,
      });
    } catch {
      updateSlot(slotId, { error: "Kunne ikke lese PDF-filen." });
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const slotId = activeSlotIdRef.current;
    if (!file || !slotId) return;

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      handlePDFFile(file, slotId);
    } else if (
      file.type === "text/csv" ||
      file.name.endsWith(".csv") ||
      file.type === "text/plain"
    ) {
      handleCSVFile(file, slotId);
    } else {
      updateSlot(slotId, { error: "Støtter kun CSV- og PDF-filer." });
    }
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const validAccounts = accounts.filter(
      (s) => s.rawData.trim() || (s.inputType === "text" && s.text.trim())
    );

    if (validAccounts.length === 0) {
      setGlobalError("Lim inn transaksjonsdata eller last opp en fil.");
      return;
    }

    const accountPayload = validAccounts.map((s) => ({
      type: s.label,
      inputType: s.inputType,
      data: s.inputType === "text" ? s.text : s.rawData,
    }));

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: accountPayload }),
      });

      if (!res.ok) {
        const errBody = (await res.json()) as { error?: string };
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json();
      const inputSource = accountPayload.length === 1 ? accountPayload[0].inputType : "multi";
      track("report_generated", { input_type: inputSource, account_count: accountPayload.length });
      track("input_type", { type: inputSource });
      sessionStorage.setItem("spareRapport", JSON.stringify(result));
      router.push("/rapport");
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Analyse feilet. Prøv igjen."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {accounts.map((slot, index) => (
        <div
          key={slot.id}
          className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm"
        >
          {/* Header: type selector + remove button for slots 2/3 */}
          <div className="flex items-center justify-between">
            <select
              value={slot.label}
              onChange={(e) =>
                updateSlot(slot.id, { label: e.target.value as AccountLabel })
              }
              className="text-sm font-semibold text-gray-700 bg-transparent border-none focus:outline-none cursor-pointer"
              aria-label="Kontotype"
            >
              <option value="lønnskonto">Lønnskonto</option>
              <option value="brukskonto">Brukskonto</option>
              <option value="sparekonto">Sparekonto</option>
            </select>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1"
                aria-label="Fjern konto"
              >
                ×
              </button>
            )}
          </div>

          {/* Content: show file card when file loaded, textarea otherwise */}
          {slot.rawData && slot.inputType !== "text" ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <svg
                className="w-5 h-5 text-emerald-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-emerald-800 truncate flex-1">
                {slot.text.split("\n")[0]}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateSlot(slot.id, {
                    text: "",
                    rawData: "",
                    inputType: "text",
                    error: null,
                  })
                }
                className="text-emerald-600 hover:text-emerald-800 text-sm flex-shrink-0"
                aria-label="Fjern fil"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="relative">
              <textarea
                className="w-full min-h-36 sm:min-h-[160px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y transition-shadow"
                placeholder={
                  index === 0
                    ? "Lim inn transaksjoner her (f.eks. fra nettbank) — eller last opp en CSV/PDF-fil nedenfor."
                    : "Lim inn transaksjoner, eller last opp en fil."
                }
                value={slot.text}
                onChange={(e) =>
                  updateSlot(slot.id, {
                    text: e.target.value,
                    rawData: e.target.value,
                    inputType: "text",
                  })
                }
                aria-label={`Transaksjonsdata for ${slot.label}`}
              />
              {slot.text.length > 0 && (
                <div className="absolute bottom-3 right-3 text-xs text-gray-300 select-none">
                  {slot.text.length} tegn
                </div>
              )}
            </div>
          )}

          {/* Per-slot error */}
          {slot.error && (
            <p className="text-red-600 text-sm rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              {slot.error}
            </p>
          )}

          {/* File upload button */}
          <button
            type="button"
            onClick={() => triggerFileUpload(slot.id)}
            className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-600 font-medium py-2 px-4 rounded-xl transition-colors text-sm hover:bg-gray-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Last opp CSV/PDF
          </button>
        </div>
      ))}

      {/* Progressive disclosure: + Legg til konto */}
      {canAddAccount && (
        <button
          type="button"
          onClick={addSlot}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium px-2 py-1 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Legg til konto
        </button>
      )}

      {globalError && (
        <p className="text-red-600 text-sm rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          {globalError}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors text-base shadow-sm hover:shadow-md"
        >
          Analyser utgiftene mine
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.pdf,text/csv,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex justify-center pt-1">
        <PrivacyBadge />
      </div>
    </form>
  );
}

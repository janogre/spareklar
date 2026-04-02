export const dynamic = "force-dynamic";

import InputForm from "@/components/InputForm";
import TrustBadge from "@/components/TrustBadge";
import PrivacyBadge from "@/components/PrivacyBadge";
import { kv } from "@/lib/kv";
import { testimonials } from "@/config/testimonials";

async function getReportCount(): Promise<number> {
  try {
    const count = await kv.get<number>("stats:reports_generated");
    return count ?? 0;
  } catch {
    return 0;
  }
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h3m0 0V8m0 4H5m14 0h-3m0 0V8m0 4h3" />
    </svg>
  );
}

export default async function Home() {
  const reportCount = await getReportCount();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Finn ut hva du kan spare —{" "}
          <span className="text-gradient-hero">på 60 sekunder</span>
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
          Lim inn transaksjoner fra nettbanken din, eller last opp en CSV/PDF
          kontoutskrift. Vi analyserer utgiftene dine og gir deg konkrete råd.
        </p>
      </div>

      {/* Trust badge — report counter */}
      <TrustBadge count={reportCount} />

      {/* Trust grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-4 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
            <ShieldIcon />
          </div>
          <p className="text-sm font-semibold text-gray-800">Data slettes umiddelbart</p>
          <p className="text-xs text-gray-400">Vi lagrer ingenting etter analyse</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-4 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
            <BoltIcon />
          </div>
          <p className="text-sm font-semibold text-gray-800">Resultater på under 30 sek</p>
          <p className="text-xs text-gray-400">AI-analyse i sanntid</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-4 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
            <GiftIcon />
          </div>
          <p className="text-sm font-semibold text-gray-800">Helt gratis, ingen konto</p>
          <p className="text-xs text-gray-400">Ingen registrering kreves</p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
          >
            <p className="text-sm text-gray-600 leading-relaxed">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-auto">
              <p className="text-sm font-semibold text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-400">{t.location}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input form */}
      <InputForm />

      {/* Privacy badge */}
      <div className="flex justify-center">
        <PrivacyBadge />
      </div>
    </div>
  );
}

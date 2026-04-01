import InputForm from "@/components/InputForm";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
          Finn ut hva du kan spare —{" "}
          <span className="text-blue-600">på 60 sekunder</span>
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-lg mx-auto">
          Lim inn transaksjoner fra nettbanken din, eller last opp en CSV/PDF
          kontoutskrift. Vi analyserer utgiftene dine og gir deg konkrete råd.
        </p>
      </div>

      <InputForm />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm text-gray-500">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">🔒</span>
          <span>Data slettes umiddelbart</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">⚡</span>
          <span>Resultater på under 30 sek</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl">🆓</span>
          <span>Helt gratis, ingen konto</span>
        </div>
      </div>
    </div>
  );
}

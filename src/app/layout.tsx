import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spareklar — Finn ut hva du kan spare",
  description:
    "Analyser utgiftene dine og få personlige spareanbefalinger på under ett minutt. Ingen konto kreves.",
  openGraph: {
    title: "Spareklar — Finn ut hva du kan spare",
    description: "Gratis analyse av utgiftene dine. Resultater på 60 sekunder.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body className="min-h-screen bg-[--background] text-[--foreground] antialiased">
        <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <a href="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Spareklar
            </a>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
          {children}
        </main>
        {/* TODO: Re-add Vercel Analytics once upgraded to Next.js 15 + React 19 */}
      </body>
    </html>
  );
}

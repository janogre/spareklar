import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
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
        <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center gap-2">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-700 transition-colors">
                <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="white" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-[17px] tracking-tight leading-none">
                Spare<span className="text-blue-600">klar</span>
              </span>
            </a>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}

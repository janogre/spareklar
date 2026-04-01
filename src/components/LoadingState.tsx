"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyserer transaksjonsdata…",
  "Finner sparemuligheter…",
  "Sammenligner priser og tilbud…",
  "Beregner potensielle besparelser…",
  "Gjør klar din personlige rapport…",
];

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-gray-600 text-center text-sm sm:text-base max-w-xs transition-all duration-500">
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
}

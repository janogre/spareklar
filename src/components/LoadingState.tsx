"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "Analyserer transaksjonsdata…", progress: 20 },
  { label: "Finner sparemuligheter…", progress: 40 },
  { label: "Sammenligner priser og tilbud…", progress: 60 },
  { label: "Beregner potensielle besparelser…", progress: 80 },
  { label: "Gjør klar din personlige rapport…", progress: 95 },
];

export default function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const target = STEPS[stepIndex].progress;
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        if (prev >= target) {
          clearInterval(timer);
          return prev;
        }
        return Math.min(prev + 2, target);
      });
    }, 40);
    return () => clearInterval(timer);
  }, [stepIndex]);

  const currentStep = STEPS[stepIndex];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8 animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing ring + spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full bg-blue-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Step label */}
        <p className="text-gray-700 text-center text-sm sm:text-base font-medium transition-all duration-500 min-h-[24px]">
          {currentStep.label}
        </p>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Analyserer…</span>
            <span>{displayProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < stepIndex
                  ? "w-2 h-2 bg-blue-500"
                  : i === stepIndex
                  ? "w-3 h-3 bg-blue-600"
                  : "w-2 h-2 bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

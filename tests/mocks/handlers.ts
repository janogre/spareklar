import { http, HttpResponse } from "msw";

export const MOCK_CLAUDE_RESPONSE = {
  totalEstimatedSavingsNOK: 4800,
  recommendations: [
    {
      rank: 1,
      category: "electricity",
      action: "Bytt til Tibber og spar på strøm",
      reason: "Du bruker mer strøm enn gjennomsnittet for din boligstørrelse.",
      specific_transactions: ["Fjordkraft 1 200 kr/mnd"],
      estimatedSavingsNOK: 2400,
      affiliateKey: "electricity",
    },
    {
      rank: 2,
      category: "loans",
      action: "Refinansier forbrukslånet ditt",
      reason: "Renten på lånet ditt er høyere enn markedssnittet.",
      specific_transactions: ["Santander forbrukslån 2 800 kr/mnd"],
      estimatedSavingsNOK: 1800,
      affiliateKey: "loans",
    },
    {
      rank: 3,
      category: "mobile",
      action: "Finn billigere mobilabonnement",
      reason: "Du betaler mer enn nødvendig for mobilabonnementet.",
      specific_transactions: ["Telenor mobil 599 kr/mnd"],
      estimatedSavingsNOK: 600,
      affiliateKey: "mobile",
    },
  ],
  positives: [
    "Du sparer jevnlig i måneden – bra gjort!",
    "Matbudsjettet ditt er godt kontrollert.",
  ],
  no_change_needed: ["Strømprisen din ser fornuftig ut", "Forsikringene dine ser ut til å være konkurransedyktige"],
};

export const handlers = [
  // Mock the /api/analyze endpoint
  http.post("/api/analyze", async () => {
    return HttpResponse.json(MOCK_CLAUDE_RESPONSE);
  }),
  // Mock the /api/share endpoint
  http.post("/api/share", async () => {
    return HttpResponse.json({ token: "testTok1", shareUrl: "https://spareklar.no/r/testTok1" });
  }),
];

import { http, HttpResponse } from "msw";

export const MOCK_CLAUDE_RESPONSE = {
  totalEstimatedSavingsNOK: 4800,
  recommendations: [
    {
      rank: 1,
      category: "electricity",
      action: "Bytt til Tibber og spar på strøm",
      reason: "Du bruker mer strøm enn gjennomsnittet for din boligstørrelse.",
      estimatedSavingsNOK: 2400,
      affiliateKey: "electricity",
    },
    {
      rank: 2,
      category: "loans",
      action: "Refinansier forbrukslånet ditt",
      reason: "Renten på lånet ditt er høyere enn markedssnittet.",
      estimatedSavingsNOK: 1800,
      affiliateKey: "loans",
    },
    {
      rank: 3,
      category: "mobile",
      action: "Finn billigere mobilabonnement",
      reason: "Du betaler mer enn nødvendig for mobilabonnementet.",
      estimatedSavingsNOK: 600,
      affiliateKey: "mobile",
    },
  ],
  positives: [
    "Du sparer jevnlig i måneden – bra gjort!",
    "Matbudsjettet ditt er godt kontrollert.",
  ],
};

export const handlers = [
  // Mock the /api/analyze endpoint
  http.post("/api/analyze", async () => {
    return HttpResponse.json(MOCK_CLAUDE_RESPONSE);
  }),
];

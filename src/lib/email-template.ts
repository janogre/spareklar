import type { AnalysisResult, Recommendation } from "@/lib/claude";
import affiliatesData from "@/config/affiliates.json";

// Escape HTML special characters to prevent injection in email clients.
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface AffiliateEntry {
  partnerName: string;
  url: string;
  cta: string;
  category: string;
}

function getAffiliate(key: string | null): AffiliateEntry | null {
  if (!key) return null;
  const data = affiliatesData as Record<string, AffiliateEntry>;
  return data[key] ?? null;
}

function buildRecommendationHtml(rec: Recommendation): string {
  const affiliate = getAffiliate(rec.affiliateKey);
  const transactionList = rec.specific_transactions
    .map((t) => `<li style="margin-bottom:4px;">${esc(t)}</li>`)
    .join("\n");

  const affiliateBtn = affiliate
    ? `<p style="margin-top:10px;">
        <a href="${affiliate.url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;border-radius:6px;">${esc(affiliate.cta)} &rarr;</a>
      </p>`
    : "";

  return `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">
          ${esc(rec.rank.toString())}. ${esc(rec.action)}
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
          Estimert besparelse: <strong style="color:#16a34a;">${esc(rec.estimatedSavingsNOK.toLocaleString("nb-NO"))} kr/år</strong>
        </p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151;">${esc(rec.reason)}</p>
        ${
          rec.specific_transactions.length > 0
            ? `<ul style="margin:0 0 8px;padding-left:18px;font-size:13px;color:#6b7280;">${transactionList}</ul>`
            : ""
        }
        ${affiliateBtn}
      </td>
    </tr>`;
}

function buildSpendingTableHtml(
  breakdown: NonNullable<AnalysisResult["spendingBreakdown"]>
): string {
  if (!breakdown || breakdown.length === 0) return "";
  const rows = breakdown
    .map(
      (item) => `
    <tr>
      <td style="padding:6px 12px 6px 0;font-size:13px;color:#374151;">${esc(item.labelNO ?? item.category)}</td>
      <td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;">${esc(item.amountNOK.toLocaleString("nb-NO"))} kr</td>
      <td style="padding:6px 0 6px 12px;font-size:13px;color:#9ca3af;text-align:right;">${esc(item.percentage.toFixed(0))}%</td>
    </tr>`
    )
    .join("\n");
  return `
    <h3 style="font-size:15px;font-weight:700;color:#111827;margin:0 0 8px;">Utgiftsoversikt</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;font-size:12px;color:#9ca3af;font-weight:600;padding-bottom:4px;">Kategori</th>
          <th style="text-align:right;font-size:12px;color:#9ca3af;font-weight:600;padding-bottom:4px;">Beløp</th>
          <th style="text-align:right;font-size:12px;color:#9ca3af;font-weight:600;padding-bottom:4px;padding-left:12px;">Andel</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function buildEmailHtml(result: AnalysisResult): string {
  const savings = result.totalEstimatedSavingsNOK.toLocaleString("nb-NO");
  const recommendationRows = result.recommendations
    .map(buildRecommendationHtml)
    .join("\n");

  const positivesHtml =
    result.positives.length > 0
      ? `<h3 style="font-size:15px;font-weight:700;color:#111827;margin:24px 0 8px;">Hva du gjør bra</h3>
         <ul style="margin:0;padding-left:18px;font-size:14px;color:#374151;">
           ${result.positives.map((p) => `<li style="margin-bottom:4px;">${esc(p)}</li>`).join("\n")}
         </ul>`
      : "";

  const spendingHtml =
    result.spendingBreakdown && result.spendingBreakdown.length > 0
      ? buildSpendingTableHtml(result.spendingBreakdown)
      : "";

  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Din Sparerapport fra Spareklar</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#bfdbfe;letter-spacing:0.08em;text-transform:uppercase;">Din Sparerapport</p>
              <p style="margin:8px 0 4px;font-size:42px;font-weight:800;color:#ffffff;">${esc(savings)} kr</p>
              <p style="margin:0;font-size:14px;color:#bfdbfe;">potensielle besparelser per år</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">

              ${spendingHtml}

              <!-- Recommendations -->
              <h3 style="font-size:15px;font-weight:700;color:#111827;margin:0 0 8px;">Anbefalinger</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${recommendationRows}
              </table>

              ${positivesHtml}

            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <a href="https://spareklar.no" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
                Lag en ny rapport på spareklar.no
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f3f4f6;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Du mottok denne e-posten fordi du ba om å få rapporten din tilsendt.
                <br />
                <a href="{{unsubscribeUrl}}" style="color:#6b7280;">Meld deg av</a>
                &nbsp;&bull;&nbsp;
                <a href="https://spareklar.no" style="color:#6b7280;">spareklar.no</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

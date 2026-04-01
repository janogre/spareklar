# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: text-flow.spec.ts >> Text input flow >> privacy badge is visible on landing page
- Location: e2e/text-flow.spec.ts:86:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/data slettes/i).or(getByText(/personvern/i)).or(locator('[data-testid="privacy-badge"]'))
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/data slettes/i).or(getByText(/personvern/i)).or(locator('[data-testid="privacy-badge"]'))

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const SAMPLE_TRANSACTIONS = `
  4   | Strøm Hafslund: 1250 kr/mnd
  5   | Netflix: 179 kr/mnd
  6   | Spotify: 99 kr/mnd
  7   | Forbrukslån Santander: 2800 kr/mnd (rente 18%)
  8   | Mobilabonnement Telenor: 499 kr/mnd
  9   | Mathandel: 7500 kr/mnd
  10  | `.trim();
  11  | 
  12  | test.describe("Text input flow", () => {
  13  |   test("paste text → analyze → report renders with recommendations", async ({
  14  |     page,
  15  |   }) => {
  16  |     await page.goto("/");
  17  | 
  18  |     // Landing page should be visible
  19  |     await expect(page).toHaveTitle(/Spareklar/i);
  20  | 
  21  |     // Textarea or text input area should exist
  22  |     const textarea = page.locator("textarea").first();
  23  |     await expect(textarea).toBeVisible();
  24  | 
  25  |     // Type/paste sample transactions
  26  |     await textarea.fill(SAMPLE_TRANSACTIONS);
  27  | 
  28  |     // Find and click the Analyser button
  29  |     const analyseButton = page
  30  |       .getByRole("button", { name: /analyser/i })
  31  |       .or(page.getByRole("button", { name: /analyse/i }));
  32  |     await expect(analyseButton).toBeVisible();
  33  |     await analyseButton.click();
  34  | 
  35  |     // Loading state should appear
  36  |     await expect(page.locator('[data-testid="loading"]').or(page.getByText(/analyserer/i))).toBeVisible({ timeout: 3000 }).catch(() => {
  37  |       // Loading may be very brief — not a failure if not seen
  38  |     });
  39  | 
  40  |     // Report should render with recommendations
  41  |     await expect(
  42  |       page.locator('[data-testid="rapport"]').or(
  43  |         page.getByText(/spareanbefalinger/i)
  44  |           .or(page.getByText(/estimert/i))
  45  |       )
  46  |     ).toBeVisible({ timeout: 30_000 });
  47  | 
  48  |     // At least one recommendation card should be visible
  49  |     const recCards = page
  50  |       .locator('[data-testid="recommendation-card"]')
  51  |       .or(page.locator(".recommendation"));
  52  |     await expect(recCards.first()).toBeVisible({ timeout: 30_000 });
  53  |   });
  54  | 
  55  |   test("share card generates after analysis", async ({ page }) => {
  56  |     await page.goto("/");
  57  | 
  58  |     const textarea = page.locator("textarea").first();
  59  |     await textarea.fill(SAMPLE_TRANSACTIONS);
  60  | 
  61  |     const analyseButton = page
  62  |       .getByRole("button", { name: /analyser/i })
  63  |       .or(page.getByRole("button", { name: /analyse/i }));
  64  |     await analyseButton.click();
  65  | 
  66  |     // Wait for report
  67  |     await page.waitForURL(/rapport/i, { timeout: 30_000 }).catch(() => {});
  68  | 
  69  |     // Find and click share button
  70  |     const shareButton = page
  71  |       .getByRole("button", { name: /del/i })
  72  |       .or(page.getByRole("button", { name: /share/i }))
  73  |       .or(page.locator('[data-testid="share-button"]'));
  74  | 
  75  |     if (await shareButton.isVisible()) {
  76  |       await shareButton.click();
  77  | 
  78  |       // Share card or download should trigger
  79  |       // Either a canvas element or a download dialog
  80  |       const canvas = page.locator("canvas");
  81  |       const downloaded = page.locator('[data-testid="share-card"]');
  82  |       await expect(canvas.or(downloaded)).toBeVisible({ timeout: 10_000 });
  83  |     }
  84  |   });
  85  | 
  86  |   test("privacy badge is visible on landing page", async ({ page }) => {
  87  |     await page.goto("/");
  88  |     // Privacy badge should be visible — "Data slettes umiddelbart" or similar
  89  |     await expect(
  90  |       page
  91  |         .getByText(/data slettes/i)
  92  |         .or(page.getByText(/personvern/i))
  93  |         .or(page.locator('[data-testid="privacy-badge"]'))
> 94  |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  95  |   });
  96  | 
  97  |   test("empty input shows Norwegian error message", async ({ page }) => {
  98  |     await page.goto("/");
  99  | 
  100 |     const analyseButton = page
  101 |       .getByRole("button", { name: /analyser/i })
  102 |       .or(page.getByRole("button", { name: /analyse/i }));
  103 | 
  104 |     if (await analyseButton.isVisible()) {
  105 |       await analyseButton.click();
  106 | 
  107 |       // An error message should appear in Norwegian
  108 |       await expect(
  109 |         page
  110 |           .getByText(/skriv inn/i)
  111 |           .or(page.getByText(/feil/i))
  112 |           .or(page.getByText(/påkrevd/i))
  113 |           .or(page.locator('[data-testid="error-message"]'))
  114 |       ).toBeVisible({ timeout: 5_000 });
  115 |     }
  116 |   });
  117 | 
  118 |   test("no English text leakage in visible UI", async ({ page }) => {
  119 |     await page.goto("/");
  120 | 
  121 |     // These are common English UI strings that should NOT appear
  122 |     const englishPatterns = [
  123 |       "Submit",
  124 |       "Upload",
  125 |       "Click here",
  126 |       "Enter your",
  127 |       "Please enter",
  128 |       "Error occurred",
  129 |       "Something went wrong",
  130 |     ];
  131 | 
  132 |     const bodyText = await page.locator("body").innerText();
  133 |     for (const pattern of englishPatterns) {
  134 |       expect(
  135 |         bodyText,
  136 |         `English text "${pattern}" found in UI — must be Norwegian`
  137 |       ).not.toContain(pattern);
  138 |     }
  139 |   });
  140 | });
  141 | 
```
import { test, expect } from "@playwright/test";

const SAMPLE_TRANSACTIONS = `
Strøm Hafslund: 1250 kr/mnd
Netflix: 179 kr/mnd
Spotify: 99 kr/mnd
Forbrukslån Santander: 2800 kr/mnd (rente 18%)
Mobilabonnement Telenor: 499 kr/mnd
Mathandel: 7500 kr/mnd
`.trim();

// Full analyze-flow tests require a live ANTHROPIC_API_KEY. Skip in CI unless key is provided.
const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;

test.describe("Text input flow", () => {
  test("paste text → analyze → report renders with recommendations", async ({
    page,
  }) => {
    test.skip(!HAS_API_KEY, "Requires ANTHROPIC_API_KEY");
    await page.goto("/");

    // Landing page should be visible
    await expect(page).toHaveTitle(/Spareklar/i);

    // Textarea or text input area should exist
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible();

    // Type/paste sample transactions
    await textarea.fill(SAMPLE_TRANSACTIONS);

    // Find and click the Analyser button
    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));
    await expect(analyseButton).toBeVisible();
    await analyseButton.click();

    // Loading state should appear
    await expect(page.locator('[data-testid="loading"]').or(page.getByText(/analyserer/i))).toBeVisible({ timeout: 3000 }).catch(() => {
      // Loading may be very brief — not a failure if not seen
    });

    // Report should render with recommendations
    await expect(
      page.locator('[data-testid="rapport"]').or(
        page.getByText(/spareanbefalinger/i)
          .or(page.getByText(/estimert/i))
      )
    ).toBeVisible({ timeout: 30_000 });

    // At least one recommendation card should be visible
    const recCards = page
      .locator('[data-testid="recommendation-card"]')
      .or(page.locator(".recommendation"));
    await expect(recCards.first()).toBeVisible({ timeout: 30_000 });
  });

  test("share card generates after analysis", async ({ page }) => {
    test.skip(!HAS_API_KEY, "Requires ANTHROPIC_API_KEY");
    await page.goto("/");

    const textarea = page.locator("textarea").first();
    await textarea.fill(SAMPLE_TRANSACTIONS);

    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));
    await analyseButton.click();

    // Wait for report
    await page.waitForURL(/rapport/i, { timeout: 30_000 }).catch(() => {});

    // Find and click share button
    const shareButton = page
      .getByRole("button", { name: /del/i })
      .or(page.getByRole("button", { name: /share/i }))
      .or(page.locator('[data-testid="share-button"]'));

    if (await shareButton.isVisible()) {
      await shareButton.click();

      // Share card or download should trigger
      // Either a canvas element or a download dialog
      const canvas = page.locator("canvas");
      const downloaded = page.locator('[data-testid="share-card"]');
      await expect(canvas.or(downloaded)).toBeVisible({ timeout: 10_000 });
    }
  });

  test("privacy badge is visible on landing page", async ({ page }) => {
    await page.goto("/");
    // Privacy badge should be visible — "Data slettes umiddelbart" or similar
    await expect(
      page
        .getByText(/data slettes/i)
        .or(page.getByText(/personvern/i))
        .or(page.locator('[data-testid="privacy-badge"]'))
    ).toBeVisible();
  });

  test("empty input shows Norwegian error message", async ({ page }) => {
    await page.goto("/");

    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));

    if (await analyseButton.isVisible()) {
      await analyseButton.click();

      // An error message should appear in Norwegian
      // Actual error text: "Lim inn transaksjonsdata eller last opp en fil."
      // Use a precise match that doesn't collide with the description text
      await expect(
        page
          .getByText(/transaksjonsdata/i)
          .or(page.locator('[data-testid="error-message"]'))
          .or(page.locator("p.text-red-600"))
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("no English text leakage in visible UI", async ({ page }) => {
    await page.goto("/");

    // These are common English UI strings that should NOT appear
    const englishPatterns = [
      "Submit",
      "Upload",
      "Click here",
      "Enter your",
      "Please enter",
      "Error occurred",
      "Something went wrong",
    ];

    const bodyText = await page.locator("body").innerText();
    for (const pattern of englishPatterns) {
      expect(
        bodyText,
        `English text "${pattern}" found in UI — must be Norwegian`
      ).not.toContain(pattern);
    }
  });
});

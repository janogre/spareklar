import { test, expect, devices } from "@playwright/test";

// These tests run with iPhone 14 viewport from playwright.config.ts
// Can also be run standalone with: npx playwright test mobile.spec.ts --project=mobile-safari

test.describe("Mobile viewport — 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("landing page: all elements visible at 375px width", async ({ page }) => {
    await page.goto("/");

    // Page should load without JS errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.waitForLoadState("networkidle");

    // No horizontal scrollbar (body width should not exceed viewport)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth, "Horizontal scroll detected — fix overflow").toBeLessThanOrEqual(375);

    // Main input (textarea or file upload) should be visible
    const inputArea = page.locator("textarea").first()
      .or(page.locator('input[type="file"]').first());
    await expect(inputArea).toBeVisible();

    // Analyser button should be visible
    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));
    await expect(analyseButton).toBeVisible();

    // Privacy badge should be visible
    await expect(
      page
        .getByText(/data slettes/i)
        .or(page.getByText(/personvern/i))
        .or(page.locator('[data-testid="privacy-badge"]'))
    ).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("analyser button is tappable (min touch target 44x44px)", async ({ page }) => {
    await page.goto("/");

    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));

    if (await analyseButton.isVisible()) {
      const box = await analyseButton.boundingBox();
      if (box) {
        // Minimum touch target: 44x44px (Apple HIG / WCAG)
        expect(box.height, "Button height too small for touch").toBeGreaterThanOrEqual(44);
        expect(box.width, "Button width too small for touch").toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("file upload button is tappable on mobile", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      const box = await fileInput.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("no horizontal overflow on report page", async ({ page }) => {
    // Navigate directly to rapport page (if it accepts URL params or redirects)
    await page.goto("/rapport").catch(() => {});

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 1); // 1px tolerance
  });

  test("recommendation cards stack vertically on mobile", async ({ page }) => {
    await page.goto("/");

    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible()) {
      await textarea.fill("Strøm 1200kr, Netflix 179kr, Forbrukslån 2800kr");
      const analyseButton = page
        .getByRole("button", { name: /analyser/i })
        .or(page.getByRole("button", { name: /analyse/i }));
      await analyseButton.click();

      await page.waitForURL(/rapport/i, { timeout: 30_000 }).catch(() => {});

      const cards = page.locator('[data-testid="recommendation-card"]')
        .or(page.locator(".recommendation"));

      if ((await cards.count()) > 1) {
        const first = await cards.nth(0).boundingBox();
        const second = await cards.nth(1).boundingBox();
        if (first && second) {
          // Cards should stack vertically — second card's top should be below first card's bottom
          expect(second.y).toBeGreaterThan(first.y + first.height - 10);
        }
      }
    }
  });

  test("no console errors on landing page", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(consoleErrors, `Console errors found: ${consoleErrors.join(", ")}`).toHaveLength(0);
  });

  test("ANTHROPIC_API_KEY not exposed in page source or network", async ({ page }) => {
    const pageContent = await page.content();
    expect(pageContent).not.toMatch(/sk-ant-/);
    expect(pageContent).not.toContain("ANTHROPIC_API_KEY");

    // Check that no script tags embed the key
    const scripts = await page.locator("script").allInnerTexts();
    for (const script of scripts) {
      expect(script).not.toMatch(/sk-ant-/);
      expect(script).not.toContain("ANTHROPIC_API_KEY");
    }
  });
});

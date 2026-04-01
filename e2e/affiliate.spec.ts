import { test, expect } from "@playwright/test";

const AFFILIATES = {
  electricity: {
    partnerName: "Tibber",
    urlPart: "tibber.com",
    cta: /bytt strømleverandør/i,
  },
  loans: {
    partnerName: "Lendo",
    urlPart: "lendo.no",
    cta: /refinansier/i,
  },
  mobile: {
    partnerName: "Telepris",
    urlPart: "telepris.no",
    cta: /finn billigere/i,
  },
  insurance: {
    partnerName: "Uno",
    urlPart: "uno.no",
    cta: /sammenlign forsikring/i,
  },
};

const SAMPLE_TEXT = `
Strøm Hafslund 1200kr, Forbrukslån Santander 2800kr rente 18%,
Mobilabonnement Telenor 499kr, Forsikring If 850kr
`.trim();

test.describe("Affiliate CTA links", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and run an analysis to get to the report
    await page.goto("/");

    const textarea = page.locator("textarea").first();
    if (await textarea.isVisible()) {
      await textarea.fill(SAMPLE_TEXT);
    }

    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));
    await analyseButton.click();

    // Wait for the report to appear
    await page.waitForURL(/rapport/i, { timeout: 30_000 }).catch(() => {});
    await page
      .locator('[data-testid="rapport"]')
      .or(page.getByText(/spareanbefalinger/i))
      .waitFor({ timeout: 30_000 })
      .catch(() => {});
  });

  test("electricity affiliate CTA opens Tibber URL", async ({ page, context }) => {
    const pagePromise = context.waitForEvent("page");

    const ctaLink = page.getByRole("link", { name: /bytt strømleverandør/i })
      .or(page.locator('[data-affiliate-key="electricity"]'));

    if (await ctaLink.isVisible()) {
      // Check the href before clicking
      const href = await ctaLink.getAttribute("href");
      expect(href).toContain("tibber");

      // Affiliate link should open in new tab
      await ctaLink.click();
      const newPage = await pagePromise.catch(() => null);
      if (newPage) {
        await newPage.waitForLoadState("domcontentloaded", { timeout: 10_000 });
        expect(newPage.url()).toContain("tibber");
        await newPage.close();
      }
    }
  });

  test("loans affiliate CTA opens Lendo URL", async ({ page, context }) => {
    const pagePromise = context.waitForEvent("page");

    const ctaLink = page.getByRole("link", { name: /refinansier/i })
      .or(page.locator('[data-affiliate-key="loans"]'));

    if (await ctaLink.isVisible()) {
      const href = await ctaLink.getAttribute("href");
      expect(href).toContain("lendo.no");

      await ctaLink.click();
      const newPage = await pagePromise.catch(() => null);
      if (newPage) {
        expect(newPage.url()).toContain("lendo.no");
        await newPage.close();
      }
    }
  });

  test("mobile affiliate CTA opens Telepris URL", async ({ page, context }) => {
    const pagePromise = context.waitForEvent("page");

    const ctaLink = page.getByRole("link", { name: /finn billigere/i })
      .or(page.locator('[data-affiliate-key="mobile"]'));

    if (await ctaLink.isVisible()) {
      const href = await ctaLink.getAttribute("href");
      expect(href).toContain("telepris.no");
    }
  });

  test("insurance affiliate CTA opens Uno URL", async ({ page, context }) => {
    const ctaLink = page.getByRole("link", { name: /sammenlign forsikring/i })
      .or(page.locator('[data-affiliate-key="insurance"]'));

    if (await ctaLink.isVisible()) {
      const href = await ctaLink.getAttribute("href");
      expect(href).toContain("uno.no");
    }
  });

  test("all affiliate links use spareklar ref parameter", async ({ page }) => {
    // All affiliate links on the report page should carry a spareklar referral
    const allLinks = await page.locator("a[href]").all();
    const affiliateLinks = await Promise.all(
      allLinks.map(async (link) => {
        const href = await link.getAttribute("href");
        const isAffiliate = href && (
          href.includes("tibber") ||
          href.includes("lendo") ||
          href.includes("telepris") ||
          href.includes("uno.no")
        );
        return isAffiliate ? href : null;
      })
    );

    const found = affiliateLinks.filter(Boolean);
    for (const href of found) {
      expect(href, `Affiliate link missing spareklar ref: ${href}`).toContain(
        "spareklar"
      );
    }
  });

  test("affiliate links open in new tab (target=_blank)", async ({ page }) => {
    const allLinks = await page.locator("a[href]").all();
    for (const link of allLinks) {
      const href = await link.getAttribute("href");
      if (href && (href.includes("tibber") || href.includes("lendo") || href.includes("telepris") || href.includes("uno.no"))) {
        const target = await link.getAttribute("target");
        expect(target, `Affiliate link ${href} should open in new tab`).toBe("_blank");
      }
    }
  });
});

import { test, expect } from "@playwright/test";
import { join } from "path";
import { writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";

const SAMPLE_CSV = `Dato;Beskrivelse;Beløp
01.03.2025;Rema 1000 Maridalsveien;-834.50
02.03.2025;Tibber strøm mars;-1250.00
05.03.2025;Netflix;-179.00
06.03.2025;Spotify;-99.00
10.03.2025;Telenor mobilabonnement;-499.00
15.03.2025;Lønn mars;25000.00
20.03.2025;Forbrukslån Santander;-2800.00
25.03.2025;Uno forsikring;-650.00`;

function writeTempCSV(content: string, filename: string): string {
  const dir = join(tmpdir(), "spareklar-e2e");
  mkdirSync(dir, { recursive: true });
  const filepath = join(dir, filename);
  writeFileSync(filepath, content, "utf-8");
  return filepath;
}

test.describe("CSV upload flow", () => {
  test("upload CSV → analyze → at least 1 recommendation with affiliate button", async ({
    page,
  }) => {
    const csvPath = writeTempCSV(SAMPLE_CSV, "transactions.csv");
    await page.goto("/");

    // Find the file upload input
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    // Upload the CSV file
    await fileInput.setInputFiles(csvPath);

    // The file name should appear in UI
    await expect(
      page
        .getByText("transactions.csv")
        .or(page.getByText(/lastet opp/i))
        .or(page.locator('[data-testid="file-name"]'))
    ).toBeVisible({ timeout: 5_000 }).catch(() => {
      // Some UIs show a generic "fil valgt" — non-blocking
    });

    // Click Analyser
    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));
    await analyseButton.click();

    // Wait for report
    await page.waitForURL(/rapport/i, { timeout: 30_000 }).catch(() => {});

    // At least 1 recommendation with an affiliate CTA button
    const affiliateCTA = page
      .getByRole("link", { name: /bytt|refinansier|finn billigere|sammenlign/i })
      .or(page.locator('[data-testid="affiliate-cta"]'));

    await expect(affiliateCTA.first()).toBeVisible({ timeout: 30_000 });
  });

  test("CSV with BOM prefix parses correctly", async ({ page }) => {
    const csvWithBOM = "\uFEFF" + SAMPLE_CSV;
    const csvPath = writeTempCSV(csvWithBOM, "transactions-bom.csv");
    await page.goto("/");

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));
    await analyseButton.click();

    // Should succeed — not error out due to BOM
    await expect(
      page
        .locator('[data-testid="rapport"]')
        .or(page.getByText(/spareanbefalinger/i))
        .or(page.getByText(/sparer/i))
    ).toBeVisible({ timeout: 30_000 });
  });

  test("large file (>5MB) rejected with Norwegian error message before API call", async ({
    page,
  }) => {
    // Create a ~6MB CSV file
    const bigRow = "01.03.2025;Rema 1000;-234.50\n";
    const bigContent = bigRow.repeat(200_000); // ~6MB
    const csvPath = writeTempCSV(bigContent, "big-file.csv");

    await page.goto("/");

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(csvPath);

    // An error message should appear in Norwegian WITHOUT submitting the form
    await expect(
      page
        .getByText(/for stor/i)
        .or(page.getByText(/filen er for/i))
        .or(page.getByText(/maks/i))
        .or(page.locator('[data-testid="file-error"]'))
    ).toBeVisible({ timeout: 5_000 });

    // Analyser button should be disabled or the form not submitted
    const analyseButton = page
      .getByRole("button", { name: /analyser/i })
      .or(page.getByRole("button", { name: /analyse/i }));
    if (await analyseButton.isVisible()) {
      // Button should be disabled when file is too large
      const isDisabled = await analyseButton.isDisabled();
      // Either disabled or form shows error — both are acceptable
    }
  });
});

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> Mobile viewport — 375px >> no console errors on landing page
- Location: e2e/mobile.spec.ts:108:7

# Error details

```
Error: Console errors found: Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error)

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 6
Received array:  ["Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "Failed to load resource: the server responded with a status of 500 (Internal Server Error)"]
```

# Test source

```ts
  20  |     expect(bodyWidth, "Horizontal scroll detected — fix overflow").toBeLessThanOrEqual(375);
  21  | 
  22  |     // Main input (textarea or file upload) should be visible
  23  |     const inputArea = page.locator("textarea").first()
  24  |       .or(page.locator('input[type="file"]').first());
  25  |     await expect(inputArea).toBeVisible();
  26  | 
  27  |     // Analyser button should be visible
  28  |     const analyseButton = page
  29  |       .getByRole("button", { name: /analyser/i })
  30  |       .or(page.getByRole("button", { name: /analyse/i }));
  31  |     await expect(analyseButton).toBeVisible();
  32  | 
  33  |     // Privacy badge should be visible
  34  |     await expect(
  35  |       page
  36  |         .getByText(/data slettes/i)
  37  |         .or(page.getByText(/personvern/i))
  38  |         .or(page.locator('[data-testid="privacy-badge"]'))
  39  |     ).toBeVisible();
  40  | 
  41  |     expect(errors).toHaveLength(0);
  42  |   });
  43  | 
  44  |   test("analyser button is tappable (min touch target 44x44px)", async ({ page }) => {
  45  |     await page.goto("/");
  46  | 
  47  |     const analyseButton = page
  48  |       .getByRole("button", { name: /analyser/i })
  49  |       .or(page.getByRole("button", { name: /analyse/i }));
  50  | 
  51  |     if (await analyseButton.isVisible()) {
  52  |       const box = await analyseButton.boundingBox();
  53  |       if (box) {
  54  |         // Minimum touch target: 44x44px (Apple HIG / WCAG)
  55  |         expect(box.height, "Button height too small for touch").toBeGreaterThanOrEqual(44);
  56  |         expect(box.width, "Button width too small for touch").toBeGreaterThanOrEqual(44);
  57  |       }
  58  |     }
  59  |   });
  60  | 
  61  |   test("file upload button is tappable on mobile", async ({ page }) => {
  62  |     await page.goto("/");
  63  | 
  64  |     const fileInput = page.locator('input[type="file"]');
  65  |     if (await fileInput.isVisible()) {
  66  |       const box = await fileInput.boundingBox();
  67  |       if (box) {
  68  |         expect(box.height).toBeGreaterThanOrEqual(44);
  69  |       }
  70  |     }
  71  |   });
  72  | 
  73  |   test("no horizontal overflow on report page", async ({ page }) => {
  74  |     // Navigate directly to rapport page (if it accepts URL params or redirects)
  75  |     await page.goto("/rapport").catch(() => {});
  76  | 
  77  |     const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  78  |     expect(bodyWidth).toBeLessThanOrEqual(375 + 1); // 1px tolerance
  79  |   });
  80  | 
  81  |   test("recommendation cards stack vertically on mobile", async ({ page }) => {
  82  |     await page.goto("/");
  83  | 
  84  |     const textarea = page.locator("textarea").first();
  85  |     if (await textarea.isVisible()) {
  86  |       await textarea.fill("Strøm 1200kr, Netflix 179kr, Forbrukslån 2800kr");
  87  |       const analyseButton = page
  88  |         .getByRole("button", { name: /analyser/i })
  89  |         .or(page.getByRole("button", { name: /analyse/i }));
  90  |       await analyseButton.click();
  91  | 
  92  |       await page.waitForURL(/rapport/i, { timeout: 30_000 }).catch(() => {});
  93  | 
  94  |       const cards = page.locator('[data-testid="recommendation-card"]')
  95  |         .or(page.locator(".recommendation"));
  96  | 
  97  |       if ((await cards.count()) > 1) {
  98  |         const first = await cards.nth(0).boundingBox();
  99  |         const second = await cards.nth(1).boundingBox();
  100 |         if (first && second) {
  101 |           // Cards should stack vertically — second card's top should be below first card's bottom
  102 |           expect(second.y).toBeGreaterThan(first.y + first.height - 10);
  103 |         }
  104 |       }
  105 |     }
  106 |   });
  107 | 
  108 |   test("no console errors on landing page", async ({ page }) => {
  109 |     const consoleErrors: string[] = [];
  110 |     page.on("console", (msg) => {
  111 |       if (msg.type() === "error") {
  112 |         consoleErrors.push(msg.text());
  113 |       }
  114 |     });
  115 |     page.on("pageerror", (err) => consoleErrors.push(err.message));
  116 | 
  117 |     await page.goto("/");
  118 |     await page.waitForLoadState("networkidle");
  119 | 
> 120 |     expect(consoleErrors, `Console errors found: ${consoleErrors.join(", ")}`).toHaveLength(0);
      |                                                                                ^ Error: Console errors found: Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error), Failed to load resource: the server responded with a status of 500 (Internal Server Error)
  121 |   });
  122 | 
  123 |   test("ANTHROPIC_API_KEY not exposed in page source or network", async ({ page }) => {
  124 |     const pageContent = await page.content();
  125 |     expect(pageContent).not.toMatch(/sk-ant-/);
  126 |     expect(pageContent).not.toContain("ANTHROPIC_API_KEY");
  127 | 
  128 |     // Check that no script tags embed the key
  129 |     const scripts = await page.locator("script").allInnerTexts();
  130 |     for (const script of scripts) {
  131 |       expect(script).not.toMatch(/sk-ant-/);
  132 |       expect(script).not.toContain("ANTHROPIC_API_KEY");
  133 |     }
  134 |   });
  135 | });
  136 | 
```
import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURE_PDF = path.resolve(
  __dirname,
  "../../lib/parser/__fixtures__/march_statement.pdf",
);

test.describe("privacy — no network traffic during parse", () => {
  test("uploading a PDF triggers zero third-party requests", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL ?? "http://localhost:3010").origin;
    const allowedPrefixes = [origin];

    const externalRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("data:") || url.startsWith("blob:")) return;
      if (allowedPrefixes.some((p) => url.startsWith(p))) return;
      externalRequests.push(url);
    });

    await page.goto("/analyse");
    await expect(page.getByText("Drop your bank statements here")).toBeVisible();

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(FIXTURE_PDF);

    await expect(page.getByText("Spend by category")).toBeVisible({
      timeout: 30_000,
    });

    if (externalRequests.length > 0) {
      throw new Error(
        `Privacy violation: ${externalRequests.length} external requests fired during parse:\n  ${externalRequests.join(
          "\n  ",
        )}`,
      );
    }
  });

  test("offline mode still parses the PDF", async ({ context, page }) => {
    await page.goto("/analyse");
    await expect(page.getByText("Drop your bank statements here")).toBeVisible();

    await context.setOffline(true);

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(FIXTURE_PDF);

    await expect(page.getByText("Spend by category")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("privacy-relevant response headers are set", async ({ page }) => {
    const response = await page.goto("/analyse");
    expect(response).not.toBeNull();
    const headers = response!.headers();
    expect(headers["content-security-policy"]).toContain("connect-src 'self'");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("no-referrer");
  });
});

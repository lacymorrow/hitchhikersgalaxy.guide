/**
 * Phase 5 e2e smoke suite. These tests catch the most common breakage
 * classes:
 *   - dev server fails to boot
 *   - top-level routes 500
 *   - auth gate is misconfigured (/dashboard not protected)
 *   - sign-in page doesn't render
 *
 * They run against a Postgres testcontainer started in globalSetup; no
 * provider sandboxes or external services required.
 *
 * Deeper flows (real credentials sign-in, checkout, admin dashboard
 * interactions) require Payload + sandbox keys and are tracked as
 * separate follow-ups (#24-#26).
 */

import { expect, test } from "@playwright/test";
import { hasCredentialsForm } from "./fixtures";

test.describe("public routes render", () => {
  test("/ — home page responds 200 and renders body", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("/sign-in shows the sign-in card with email + password fields", async ({ page }) => {
    const response = await page.goto("/sign-in");
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).not.toBeEmpty();

    // The email/password form only renders when credentials auth is
    // enabled (requires PAYLOAD_SECRET or APP_SECRET); CI runs without
    // it, so only assert the form when the feature is on.
    const hasForm = await hasCredentialsForm(page);
    test.skip(
      !hasForm,
      "Credentials auth not enabled — set NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED"
    );

    // Whatever the heading wording is, the email and password inputs
    // are the load-bearing UI on this page.
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("/pricing renders without 5xx if the route is enabled", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBeLessThan(500);
  });

  test("/robots.txt is served", async ({ page }) => {
    const response = await page.request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(/user-agent/i);
  });
});

test.describe("auth gate", () => {
  test("/dashboard redirects an unauthenticated user to /sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test("/deployments redirects an unauthenticated user to /sign-in", async ({ page }) => {
    await page.goto("/deployments");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});

test.describe("error contract", () => {
  test("a nonexistent route renders not-found UI (Next renders 200 by design)", async ({
    page,
  }) => {
    // Cold-compiling an unknown route + the not-found page's WebGL background
    // (rAF loop blocks `load`) can take >30s in dev.
    test.setTimeout(90_000);
    await page.goto("/this-route-truly-does-not-exist-12345", {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await expect(page.locator("body")).toContainText(/not found|404|lost in space/i, {
      timeout: 30_000,
    });
  });
});

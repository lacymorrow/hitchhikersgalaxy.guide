/**
 * Credentials sign-up/sign-in and admin gate (task #25, parts 2 & 3/3).
 *
 * STATUS: SPEC — these tests describe the contract but are intentionally
 * gated. They activate once the test environment provides a Payload-ready
 * Postgres with its schema bootstrapped. The default e2e DB (Testcontainers
 * or service-container Postgres) only has the Drizzle schema pushed, so
 * Payload's tables do not exist and sign-up's server action throws.
 *
 * To activate locally:
 *   1. Point at a Postgres that has Payload's schema already migrated
 *      (e.g. `bunx payload migrate` against the test DB) — OR run against
 *      your dev DB with PAYLOAD_AUTO_SEED=false.
 *   2. Export `PLAYWRIGHT_E2E_PAYLOAD_READY=1` before `bun run test:e2e`.
 *   3. For the admin test, also set `ADMIN_DOMAINS=e2e.local` so the
 *      randomly-generated `*@e2e.local` user is treated as admin.
 *
 * What these specs catch (when active):
 *   - sign-up server action creates a Shipkit-DB user but not a Payload
 *     user (or vice-versa), breaking subsequent sign-in
 *   - sign-up redirects to a non-existent route
 *   - admin gate stops checking the role and lets any signed-in user in
 *   - admin gate keeps rejecting users who should pass
 */
import { expect, test } from "@playwright/test";
import { hasCredentialsForm } from "./fixtures";

const PAYLOAD_READY = process.env.PLAYWRIGHT_E2E_PAYLOAD_READY === "1";
const PASSWORD = "e2e-test-passw0rd!";

function uniqueEmail(prefix: string): string {
  // Random suffix so re-runs don't collide on the same Payload user.
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}@e2e.local`;
}

test.describe("Credentials sign-up → sign-in loop", () => {
  test.skip(!PAYLOAD_READY, "Requires Payload-ready test DB (see file header).");

  test("fresh user signs up, logs out, logs back in, reaches dashboard", async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto("/sign-in");
    const hasForm = await hasCredentialsForm(page);
    expect(hasForm, "Credentials form must render — check PAYLOAD_SECRET/APP_SECRET").toBe(true);

    const email = uniqueEmail("e2e-auth");

    await page.goto("/sign-up");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^password$/i).fill(PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).not.toHaveURL(/\/sign-up/, { timeout: 30_000 });

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => /session|auth/i.test(c.name));
    expect(sessionCookie, "expected a session cookie after sign-up").toBeDefined();

    await page.context().clearCookies();
    await page.goto("/sign-in");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^password$/i).fill(PASSWORD);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 30_000 });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});

test.describe("/admin role gate", () => {
  test.skip(
    !PAYLOAD_READY,
    "Requires Payload-ready test DB and ADMIN_DOMAINS=e2e.local (see file header)."
  );

  test("non-admin authenticated user is redirected away from /admin", async ({ page }) => {
    test.setTimeout(120_000);

    // The non-admin uses a domain NOT in ADMIN_DOMAINS.
    const email = uniqueEmail("e2e-user").replace("@e2e.local", "@nonadmin.test");

    await page.goto("/sign-up");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^password$/i).fill(PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).not.toHaveURL(/\/sign-up/, { timeout: 30_000 });

    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin/, { timeout: 15_000 });
  });

  test("admin-domain user reaches /admin and sees the admin nav", async ({ page }) => {
    test.setTimeout(120_000);

    // @e2e.local is the admin domain (per ADMIN_DOMAINS env, see file header).
    const email = uniqueEmail("e2e-admin");

    await page.goto("/sign-up");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^password$/i).fill(PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).not.toHaveURL(/\/sign-up/, { timeout: 30_000 });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    // The Users nav link is always present in src/app/(app)/(admin)/layout.tsx.
    await expect(page.getByRole("link", { name: /^Users$/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

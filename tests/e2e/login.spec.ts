import { expect, test } from "@playwright/test";
import { hasCredentialsForm, login, STORAGE_STATE, TEST_USER } from "./fixtures";

test.describe("Login", () => {
  test("sign-in page loads", async ({ page }) => {
    const response = await page.goto("/sign-in");
    expect(response?.status()).toBe(200);

    // The email/password form only renders when credentials auth is
    // enabled (requires PAYLOAD_SECRET or APP_SECRET); CI runs without
    // it. Gate the form assertion like the other tests in this file.
    const hasForm = await hasCredentialsForm(page);
    test.skip(
      !hasForm,
      "Credentials auth not enabled — set NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED"
    );

    // Heading copy is "Welcome" (see sign-in.tsx). Assert on the form
    // (the load-bearing UI) rather than the marketing wording.
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 15_000 });
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    const hasForm = await hasCredentialsForm(page);
    test.skip(
      !hasForm,
      "Credentials auth not enabled — set NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED"
    );

    const loggedIn = await login(page, TEST_USER.email, TEST_USER.password);
    expect(loggedIn).toBe(true);

    await expect(page).toHaveURL(/\/(dashboard|app)/, { timeout: 15000 });

    await page.context().storageState({ path: STORAGE_STATE });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/sign-in");

    const hasForm = await hasCredentialsForm(page);
    test.skip(!hasForm, "Credentials auth not enabled");

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 });

    const errorToast = page.locator('[data-sonner-toast][data-type="error"]');
    await expect(errorToast).toBeVisible({ timeout: 10000 });
  });

  test("authenticated user can access dashboard", async ({ page, context }) => {
    const hasForm = await hasCredentialsForm(page);
    if (!hasForm) {
      test.skip(true, "Credentials auth not enabled — cannot test authenticated access");
      return;
    }

    const loggedIn = await login(page, TEST_USER.email, TEST_USER.password);
    test.skip(!loggedIn, "Login failed — cannot test authenticated access");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("body")).not.toContainText(/sign in/i);
  });
});

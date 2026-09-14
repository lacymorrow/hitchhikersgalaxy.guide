/**
 * Checkout-link integrity (task #25, part 1/3).
 *
 * The previous regression spec only checks that the LemonSqueezy
 * destination is reachable. That misses the more common failure mode:
 * shipkit.io ships /pricing with a CTA that points somewhere wrong
 * (relative path, blanked-out href, or marketing copy without an
 * actual link). LAC-249 and LAC-1450 were both this class of bug.
 *
 * This spec walks /pricing and asserts the primary CTA is an anchor
 * whose href points at a real LemonSqueezy or Stripe checkout URL.
 * No external services are required — we only inspect the rendered
 * markup.
 */
import { expect, test } from "@playwright/test";

const CHECKOUT_HREF_RE = /^https:\/\/([a-z0-9-]+\.)?(lemonsqueezy\.com|stripe\.com|polar\.sh)\//i;

test.describe("Pricing CTA points at a real checkout URL", () => {
  test("/pricing primary CTA is a real https checkout link", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBe(200);

    // The CTA copy is "Get {planTitle} Now" — see pricing-section-single.tsx.
    // We match by role so a copy change still keeps the test honest.
    const cta = page.getByRole("link", { name: /^Get .+ Now$/i }).first();
    await expect(cta).toBeVisible({ timeout: 15_000 });

    const href = await cta.getAttribute("href");
    expect(href, "CTA must have an href").not.toBeNull();
    expect(href, `CTA href ${href!} must be a real checkout URL`).toMatch(CHECKOUT_HREF_RE);
  });

  test("/pricing CTA href is well-formed (parses as URL with a checkout-like path)", async ({
    page,
  }) => {
    await page.goto("/pricing");
    const cta = page.getByRole("link", { name: /^Get .+ Now$/i }).first();
    const href = (await cta.getAttribute("href"))!;

    // Will throw if not a valid absolute URL.
    const url = new URL(href);

    // Each supported provider keeps an identifying path segment in its
    // checkout URLs. If the href is correctly shaped but doesn't match
    // any known provider segment, that's a regression worth catching.
    const looksLikeCheckout =
      url.pathname.includes("/checkout") ||
      url.pathname.includes("/buy") ||
      url.pathname.includes("/pay");
    expect(looksLikeCheckout, `pathname ${url.pathname} doesn't look like a checkout`).toBe(true);
  });
});

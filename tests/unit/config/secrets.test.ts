import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regression tests for LAC-3811 P0-1.
 *
 * The derivation fallback hashes BASE_URL, which is public. If production ever
 * accepts it again, anyone who knows the site's URL can reconstruct every
 * derived secret and forge sessions.
 */
describe("secret derivation", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  const loadSecrets = async () => {
    vi.resetModules();
    return await import("@/config/secrets");
  };

  it("refuses to derive from the public BASE_URL in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.APP_SECRET = "";
    process.env.AUTH_SECRET = "";
    process.env.PAYLOAD_SECRET = "";
    process.env.BETTER_AUTH_SECRET = "";

    const { getDerivedSecrets } = await loadSecrets();
    expect(() => getDerivedSecrets()).toThrow(/APP_SECRET is not set/);
  });

  it("allows an explicit APP_SECRET in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.APP_SECRET = "a".repeat(64);
    process.env.AUTH_SECRET = "";
    process.env.PAYLOAD_SECRET = "";
    process.env.BETTER_AUTH_SECRET = "";

    const { getDerivedSecrets } = await loadSecrets();
    const secrets = getDerivedSecrets();
    expect(secrets.AUTH_SECRET).toBeTruthy();
    expect(secrets.AUTH_SECRET).not.toBe(secrets.PAYLOAD_SECRET);
  });

  it("does not demand APP_SECRET when every secret is set explicitly", async () => {
    process.env.NODE_ENV = "production";
    process.env.APP_SECRET = "";
    process.env.AUTH_SECRET = "auth-value";
    process.env.PAYLOAD_SECRET = "payload-value";
    process.env.BETTER_AUTH_SECRET = "better-value";

    const { getDerivedSecrets } = await loadSecrets();
    const secrets = getDerivedSecrets();
    expect(secrets.AUTH_SECRET).toBe("auth-value");
    expect(secrets.PAYLOAD_SECRET).toBe("payload-value");
  });

  it("still derives outside production so local development works", async () => {
    process.env.NODE_ENV = "development";
    process.env.APP_SECRET = "";
    process.env.AUTH_SECRET = "";
    process.env.PAYLOAD_SECRET = "";
    process.env.BETTER_AUTH_SECRET = "";

    const { getDerivedSecrets } = await loadSecrets();
    expect(() => getDerivedSecrets()).not.toThrow();
  });
});

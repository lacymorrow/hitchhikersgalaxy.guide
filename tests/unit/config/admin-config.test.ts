import { describe, expect, it, vi } from "vitest";

/**
 * Regression tests for LAC-3811 P0-2.
 *
 * The defaults used to be the template author's own address and domain, so
 * every downstream deployment shipped granting admin to anyone holding a
 * lacymorrow.com email.
 */
describe("adminConfig", () => {
  const load = async (env: Record<string, string | undefined>) => {
    vi.resetModules();
    vi.doMock("@/env", () => ({ env }));
    return await import("@/config/admin-config");
  };

  it("grants nobody when ADMIN_EMAIL and ADMIN_DOMAINS are unset", async () => {
    const { adminConfig } = await load({});
    expect(adminConfig.emails).toEqual([]);
    expect(adminConfig.domains).toEqual([]);
    expect(adminConfig.isAdminByEmailConfig("me@lacymorrow.com")).toBe(false);
    expect(adminConfig.isAdminByEmailConfig("anyone@example.com")).toBe(false);
  });

  it("matches a configured email case-insensitively", async () => {
    const { adminConfig } = await load({ ADMIN_EMAIL: "Owner@Example.com" });
    expect(adminConfig.isAdminByEmailConfig("owner@example.com")).toBe(true);
    expect(adminConfig.isAdminByEmailConfig("someone@example.com")).toBe(false);
  });

  it("matches the domain exactly, not as a suffix", async () => {
    const { adminConfig } = await load({ ADMIN_DOMAINS: "example.com" });
    expect(adminConfig.isAdminByEmailConfig("real@example.com")).toBe(true);
    // The old suffix check accepted a lookalike domain ending in the same text.
    expect(adminConfig.isAdminByEmailConfig("attacker@notexample.com")).toBe(false);
    expect(adminConfig.isAdminByEmailConfig("attacker@example.com.evil.net")).toBe(false);
  });

  it("ignores malformed input", async () => {
    const { adminConfig } = await load({ ADMIN_DOMAINS: "example.com" });
    expect(adminConfig.isAdminByEmailConfig("not-an-email")).toBe(false);
    expect(adminConfig.isAdminByEmailConfig("")).toBe(false);
    expect(adminConfig.isAdminByEmailConfig(null)).toBe(false);
  });
});

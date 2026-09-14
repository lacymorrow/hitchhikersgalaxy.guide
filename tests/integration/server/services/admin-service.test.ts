/**
 * Characterization tests for admin-service.isAdmin() against the live
 * Testcontainers DB. Sets up the SPEC for plan 011 (isAdmin refactor).
 *
 * isAdmin() has 4 layered checks (any one → true):
 *   1. adminConfig.isAdminByEmailConfig — static env-driven list/domain
 *   2. DB `users.role === "admin"` lookup by lowercased email
 *   3. RBAC permission check ("system", "admin") for the resolved userId
 *   4. Payload CMS user existence
 *
 * We mock Payload (returns null in tests) so this suite exercises 1-3
 * on the real DB. Check #1 is exercised by spying on the config.
 */

import { describe, expect, it, vi } from "vitest";
import { adminConfig } from "@/config/admin-config";
import { users } from "@/server/db/schema";
import { isAdmin } from "@/server/services/admin-service";
import { getTestDb } from "../../../helpers/test-db";

vi.mock("@/lib/payload/payload", () => ({
  getPayloadClient: vi.fn(async () => null),
}));

vi.mock("@/server/services/rbac", () => ({
  rbacService: {
    hasPermission: vi.fn(async () => false),
  },
}));

describe("isAdmin", () => {
  it("returns false when email is null", async () => {
    expect(await isAdmin({ email: null })).toBe(false);
  });

  it("returns false when email is undefined", async () => {
    expect(await isAdmin({})).toBe(false);
  });

  it("returns false when email is not a string", async () => {
    expect(await isAdmin({ email: 12345 as never })).toBe(false);
  });

  it("returns true when email matches the static admin email list (config check)", async () => {
    const spy = vi.spyOn(adminConfig, "isAdminByEmailConfig").mockReturnValue(true);
    try {
      expect(await isAdmin({ email: "anything@example.com" })).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it("returns true when the DB users row has role='admin' (lowercased email)", async () => {
    vi.spyOn(adminConfig, "isAdminByEmailConfig").mockReturnValue(false);

    const db = getTestDb();
    await db.insert(users).values({
      id: "admin-user-1",
      email: "admin@db.shipkit.test",
      role: "admin",
    });

    // Calls with mixed-case email; service must lowercase before lookup.
    expect(await isAdmin({ email: "Admin@DB.Shipkit.Test" })).toBe(true);
  });

  it("returns false when the user exists but role is not 'admin' and no other check passes", async () => {
    vi.spyOn(adminConfig, "isAdminByEmailConfig").mockReturnValue(false);

    const db = getTestDb();
    await db.insert(users).values({
      id: "regular-user",
      email: "regular@db.shipkit.test",
      role: "user",
    });

    expect(await isAdmin({ email: "regular@db.shipkit.test" })).toBe(false);
  });

  it("returns false when the email matches no row at all", async () => {
    vi.spyOn(adminConfig, "isAdminByEmailConfig").mockReturnValue(false);
    expect(await isAdmin({ email: "nobody@shipkit.test" })).toBe(false);
  });

  it("returns true when RBAC grants ('system','admin') even if DB role is non-admin", async () => {
    vi.spyOn(adminConfig, "isAdminByEmailConfig").mockReturnValue(false);
    const { rbacService } = await import("@/server/services/rbac");
    vi.mocked(rbacService.hasPermission).mockResolvedValueOnce(true);

    const db = getTestDb();
    await db.insert(users).values({
      id: "rbac-user",
      email: "rbac@shipkit.test",
      role: "user",
    });

    expect(await isAdmin({ email: "rbac@shipkit.test" })).toBe(true);
  });

  it("uses an explicitly-passed userId for the RBAC check when no DB user exists", async () => {
    vi.spyOn(adminConfig, "isAdminByEmailConfig").mockReturnValue(false);
    const { rbacService } = await import("@/server/services/rbac");
    vi.mocked(rbacService.hasPermission).mockResolvedValueOnce(true);

    expect(await isAdmin({ email: "no-row@shipkit.test", userId: "explicit-id" })).toBe(true);
    expect(rbacService.hasPermission).toHaveBeenCalledWith("explicit-id", "system", "admin");
  });
});

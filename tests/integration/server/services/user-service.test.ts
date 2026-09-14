/**
 * Characterization tests for user-service against the live Testcontainers
 * DB. user-service is the fundamental user-persistence layer; pinning its
 * behavior protects every auth flow above it.
 *
 * Notes:
 *   - createPersonalTeam is called as a side effect of ensureUserExists
 *     for new users. We verify the row is created but don't double-test
 *     team-service mechanics (covered separately).
 *   - PaymentService.getUserPaymentStatus is invoked as a side effect.
 *     With no payment providers configured in tests it returns false,
 *     which is fine — we don't assert on it.
 */

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { teamMembers, teams, users } from "@/server/db/schema";
import { userService } from "@/server/services/user-service";
import { getTestDb } from "../../../helpers/test-db";

describe("userService.ensureUserExists", () => {
  it("creates a new user with normalized (lowercased) email", async () => {
    const result = await userService.ensureUserExists({
      id: "new-user-1",
      email: "NewUser@Shipkit.Test",
      name: "New User",
    });

    expect(result?.id).toBe("new-user-1");
    expect(result?.email).toBe("newuser@shipkit.test");
    expect(result?.name).toBe("New User");

    const db = getTestDb();
    const row = await db.query.users.findFirst({
      where: eq(users.id, "new-user-1"),
    });
    expect(row?.email).toBe("newuser@shipkit.test");
  });

  it("creates a personal team for a new user as a side effect", async () => {
    await userService.ensureUserExists({
      id: "new-user-2",
      email: "newuser2@shipkit.test",
    });

    const db = getTestDb();
    const member = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, "new-user-2"),
      with: { team: true },
    });
    expect(member?.role).toBe("owner");
    expect(member?.team?.type).toBe("personal");
  });

  it("returns the existing user when one already exists with the same email (no duplicate insert)", async () => {
    const first = await userService.ensureUserExists({
      id: "existing-user-1",
      email: "existing@shipkit.test",
      name: "Original Name",
    });

    // Same email, different incoming id — should match by email.
    const second = await userService.ensureUserExists({
      id: "different-id",
      email: "EXISTING@shipkit.test",
    });

    expect(second?.id).toBe(first?.id);
    expect(second?.id).toBe("existing-user-1");

    const db = getTestDb();
    const matches = await db.select().from(users).where(eq(users.email, "existing@shipkit.test"));
    expect(matches).toHaveLength(1);
  });

  it("updates name when it differs on an existing user", async () => {
    await userService.ensureUserExists({
      id: "update-user-1",
      email: "update1@shipkit.test",
      name: "Old Name",
    });

    const updated = await userService.ensureUserExists({
      id: "update-user-1",
      email: "update1@shipkit.test",
      name: "New Name",
    });
    expect(updated?.name).toBe("New Name");
  });

  it("does NOT touch name when undefined is passed (only when the value differs)", async () => {
    await userService.ensureUserExists({
      id: "noop-user",
      email: "noop@shipkit.test",
      name: "Keep This",
    });

    const updated = await userService.ensureUserExists({
      id: "noop-user",
      email: "noop@shipkit.test",
      // name omitted
    });
    expect(updated?.name).toBe("Keep This");
  });

  it("throws when email is missing", async () => {
    await expect(userService.ensureUserExists({ id: "no-email", email: "" })).rejects.toThrow(
      /primary email/i
    );
  });
});

describe("userService.getUserByEmail", () => {
  it("looks up by lowercased email and returns the row", async () => {
    const db = getTestDb();
    await db.insert(users).values({
      id: "get-by-email-1",
      email: "lookup@shipkit.test",
      name: "Lookup User",
    });

    const result = await userService.getUserByEmail("LookUp@shipkit.test");
    expect(result?.id).toBe("get-by-email-1");
  });

  it("returns undefined when no row matches", async () => {
    const result = await userService.getUserByEmail("nobody@shipkit.test");
    expect(result).toBeUndefined();
  });
});

describe("userService.getUserTeams / getUserWithAssociations", () => {
  it("getUserTeams returns the user's team memberships with nested team data", async () => {
    await userService.ensureUserExists({
      id: "teams-user-1",
      email: "teams1@shipkit.test",
    });

    const memberships = await userService.getUserTeams("teams-user-1");
    expect(memberships.length).toBeGreaterThanOrEqual(1);
    // Personal team auto-created during ensureUserExists
    expect(memberships.some((m) => m.team?.type === "personal")).toBe(true);
  });

  it("returns an empty array for a user with no memberships", async () => {
    const db = getTestDb();
    await db.insert(users).values({
      id: "lonely-user",
      email: "lonely@shipkit.test",
    });

    const memberships = await userService.getUserTeams("lonely-user");
    expect(memberships).toEqual([]);

    // Sanity: no teams at all created for this user
    const allTeams = await db.select().from(teams).where(eq(teams.name, "Personal"));
    // The unrelated personal teams from other tests are truncated between
    // tests, so this should also be 0 in isolation.
    expect(allTeams.length).toBe(0);
  });
});

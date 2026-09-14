/**
 * Characterization tests for TeamService against the live Testcontainers
 * DB. Pins the current method shapes so the upcoming RBAC / team-member
 * pattern work (origin/security branch and plan 003) doesn't silently
 * change the contract.
 *
 * Key facts captured here:
 *   - createTeam / createPersonalTeam return { ...team, members: [{...member, user}] }
 *     (the nested user object — not just the team row).
 *   - deleteTeam throws ErrorService errors ("Team not found", "Cannot delete
 *     personal team") rather than returning a Result.
 *   - ensureOnePersonalTeam soft-deletes duplicates and returns the oldest
 *     existing one (by createdAt asc).
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { teamMembers, teams, users } from "@/server/db/schema";
import { TeamService } from "@/server/services/team-service";
import { getTestDb } from "../../../../helpers/test-db";

const TEST_USER_ID = "test-user-team-service";
const TEST_USER_EMAIL = "team-service-test@shipkit.test";

let teamService: TeamService;

beforeAll(() => {
  teamService = new TeamService();
});

afterEach(async () => {
  // Truncate happens in setup-integration.ts; nothing else needed here.
});

async function seedTestUser() {
  const db = getTestDb();
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: TEST_USER_EMAIL,
  });
}

describe("TeamService.createTeam (workspace)", () => {
  it("returns the team merged with a members array containing the owner", async () => {
    await seedTestUser();
    const team = await teamService.createTeam(TEST_USER_ID, "Acme Workspace");

    expect(team).toBeDefined();
    expect(team?.name).toBe("Acme Workspace");
    expect(team?.type).toBe("workspace");
    expect(team?.deletedAt).toBeNull();
    expect(Array.isArray(team?.members)).toBe(true);
    expect(team?.members).toHaveLength(1);
    expect(team?.members?.[0]?.userId).toBe(TEST_USER_ID);
    expect(team?.members?.[0]?.role).toBe("owner");
    expect(team?.members?.[0]?.user?.id).toBe(TEST_USER_ID);
  });

  it("assigns distinct UUIDs to two teams created in succession", async () => {
    await seedTestUser();
    const a = await teamService.createTeam(TEST_USER_ID, "Team A");
    const b = await teamService.createTeam(TEST_USER_ID, "Team B");
    expect(a?.id).toBeTruthy();
    expect(b?.id).toBeTruthy();
    expect(a?.id).not.toBe(b?.id);
  });

  it("persists both the team and the membership row", async () => {
    await seedTestUser();
    const team = await teamService.createTeam(TEST_USER_ID, "Persisted Team");
    const db = getTestDb();

    const teamRow = await db.query.teams.findFirst({
      where: eq(teams.id, team?.id as string),
    });
    expect(teamRow?.name).toBe("Persisted Team");

    const memberRow = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.teamId, team?.id as string),
    });
    expect(memberRow?.userId).toBe(TEST_USER_ID);
    expect(memberRow?.role).toBe("owner");
  });
});

describe("TeamService.createPersonalTeam", () => {
  it('creates a team with type="personal" and name="Personal"', async () => {
    await seedTestUser();
    const team = await teamService.createPersonalTeam(TEST_USER_ID);

    expect(team?.name).toBe("Personal");
    expect(team?.type).toBe("personal");
    expect(team?.members?.[0]?.role).toBe("owner");
  });

  it("returns null when the user does not exist (does not throw)", async () => {
    const team = await teamService.createPersonalTeam("nonexistent-user-id");
    expect(team).toBeNull();
  });
});

describe("TeamService.deleteTeam", () => {
  it("soft-deletes a workspace team (sets deletedAt)", async () => {
    await seedTestUser();
    const team = await teamService.createTeam(TEST_USER_ID, "To Delete");

    const ok = await teamService.deleteTeam(team?.id as string);
    expect(ok).toBe(true);

    const db = getTestDb();
    const row = await db.query.teams.findFirst({
      where: eq(teams.id, team?.id as string),
    });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });

  it("throws when trying to delete a personal team", async () => {
    await seedTestUser();
    const personal = await teamService.createPersonalTeam(TEST_USER_ID);
    await expect(teamService.deleteTeam(personal?.id as string)).rejects.toThrow(/personal team/i);
  });

  it("throws when the team id does not exist", async () => {
    await expect(teamService.deleteTeam("00000000-0000-0000-0000-000000000000")).rejects.toThrow(
      /not found/i
    );
  });
});

describe("TeamService.ensureOnePersonalTeam", () => {
  it("creates a personal team when none exists", async () => {
    await seedTestUser();
    const team = await teamService.ensureOnePersonalTeam(TEST_USER_ID);
    expect(team?.type).toBe("personal");
  });

  it("returns the existing personal team when exactly one exists", async () => {
    await seedTestUser();
    const original = await teamService.createPersonalTeam(TEST_USER_ID);
    const ensured = await teamService.ensureOnePersonalTeam(TEST_USER_ID);
    expect(ensured?.id).toBe(original?.id);
  });

  it("keeps the oldest and soft-deletes duplicates when multiple personals exist", async () => {
    await seedTestUser();
    const first = await teamService.createPersonalTeam(TEST_USER_ID);
    // Brief gap so createdAt differs reliably across rows
    await new Promise((r) => setTimeout(r, 10));
    const second = await teamService.createPersonalTeam(TEST_USER_ID);
    await new Promise((r) => setTimeout(r, 10));
    const third = await teamService.createPersonalTeam(TEST_USER_ID);

    const kept = await teamService.ensureOnePersonalTeam(TEST_USER_ID);
    expect(kept?.id).toBe(first?.id);

    const db = getTestDb();
    const secondRow = await db.query.teams.findFirst({
      where: eq(teams.id, second?.id as string),
    });
    const thirdRow = await db.query.teams.findFirst({
      where: eq(teams.id, third?.id as string),
    });
    expect(secondRow?.deletedAt).toBeInstanceOf(Date);
    expect(thirdRow?.deletedAt).toBeInstanceOf(Date);
  });
});

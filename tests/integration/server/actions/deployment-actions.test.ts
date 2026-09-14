/**
 * Characterization tests for deployment-actions against the live
 * Testcontainers DB. The previous version stubbed @/server/db with a
 * chainable mock that returned undefined for every step, so no test
 * actually exercised real action logic — they were red filler.
 *
 * This rewrite:
 *   - Hits the real DB started by globalSetup
 *   - Mocks ONLY @/server/auth so we can simulate signed-in / signed-out
 *     callers without standing up the full NextAuth runtime
 *   - Mocks next/cache so revalidatePath() is a no-op
 *
 * Covers: createDeployment, updateDeployment, deleteDeployment for the
 * auth-required branch (returns/throws Unauthorized) and the happy path
 * (real DB roundtrip).
 */

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDeployment,
  deleteDeployment,
  updateDeployment,
} from "@/server/actions/deployment-actions";
import { auth } from "@/server/auth";
import { deployments, users } from "@/server/db/schema";
import { getTestDb } from "../../../helpers/test-db";

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const OWNER_ID = "test-owner-deployment-actions";
const STRANGER_ID = "test-stranger-deployment-actions";

beforeEach(async () => {
  vi.mocked(auth).mockReset();
  const db = getTestDb();
  await db.insert(users).values({ id: OWNER_ID, email: "owner@shipkit.test" });
  await db.insert(users).values({ id: STRANGER_ID, email: "stranger@shipkit.test" });
});

function signIn(userId: string) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as never);
}

describe("createDeployment", () => {
  it("inserts a row owned by the signed-in user and returns it", async () => {
    signIn(OWNER_ID);
    const created = await createDeployment({
      projectName: "new-app",
      description: "first deploy",
      status: "deploying",
      vercelDeploymentUrl: "https://new-app.vercel.app",
      githubRepoUrl: "https://github.com/test/new-app",
    });

    expect(created.id).toBeTruthy();
    expect(created.userId).toBe(OWNER_ID);
    expect(created.projectName).toBe("new-app");
    expect(created.status).toBe("deploying");

    const db = getTestDb();
    const row = await db.query.deployments.findFirst({
      where: eq(deployments.id, created.id),
    });
    expect(row?.userId).toBe(OWNER_ID);
    expect(row?.vercelDeploymentUrl).toBe("https://new-app.vercel.app");
  });

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(createDeployment({ projectName: "x", status: "deploying" })).rejects.toThrow(
      /unauthorized/i
    );
  });
});

describe("updateDeployment", () => {
  async function seedDeployment(ownerId: string) {
    const db = getTestDb();
    const [row] = await db
      .insert(deployments)
      .values({
        userId: ownerId,
        projectName: "existing",
        status: "deploying",
      })
      .returning();
    return row;
  }

  it("updates a row the caller owns", async () => {
    const seed = await seedDeployment(OWNER_ID);
    signIn(OWNER_ID);

    const updated = await updateDeployment(seed!.id, {
      status: "completed",
      vercelDeploymentUrl: "https://existing.vercel.app",
    });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe("completed");
    expect(updated?.vercelDeploymentUrl).toBe("https://existing.vercel.app");
  });

  it("returns null when the caller doesn't own the row", async () => {
    const seed = await seedDeployment(OWNER_ID);
    signIn(STRANGER_ID);

    const updated = await updateDeployment(seed!.id, { status: "failed" });
    expect(updated).toBeNull();

    // Confirm the original row was NOT modified.
    const db = getTestDb();
    const row = await db.query.deployments.findFirst({
      where: eq(deployments.id, seed!.id),
    });
    expect(row?.status).toBe("deploying");
  });

  it("throws Unauthorized when no session and no explicit userId", async () => {
    const seed = await seedDeployment(OWNER_ID);
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateDeployment(seed!.id, { status: "completed" })).rejects.toThrow(
      /unauthorized/i
    );
  });

  it("permits a background-task call (userId passed explicitly, no session)", async () => {
    const seed = await seedDeployment(OWNER_ID);
    vi.mocked(auth).mockResolvedValue(null as never);

    const updated = await updateDeployment(seed!.id, { status: "completed" }, OWNER_ID);
    expect(updated?.status).toBe("completed");
  });
});

describe("deleteDeployment", () => {
  it("deletes a row the caller owns and returns true", async () => {
    const db = getTestDb();
    const [seed] = await db
      .insert(deployments)
      .values({
        userId: OWNER_ID,
        projectName: "to-delete",
        status: "completed",
      })
      .returning();
    signIn(OWNER_ID);

    const ok = await deleteDeployment(seed!.id);
    expect(ok).toBe(true);

    const row = await db.query.deployments.findFirst({
      where: eq(deployments.id, seed!.id),
    });
    expect(row).toBeUndefined();
  });

  it("does NOT delete a row owned by someone else (still returns true — characterized)", async () => {
    // This pins existing (questionable) behavior: deleteDeployment scopes
    // by (id, userId) so it silently no-ops for non-owners but still
    // returns `true`. If plan 003 (RBAC) changes this to throw, update
    // this test in the same PR — it is the spec.
    const db = getTestDb();
    const [seed] = await db
      .insert(deployments)
      .values({
        userId: OWNER_ID,
        projectName: "owner-only",
        status: "completed",
      })
      .returning();
    signIn(STRANGER_ID);

    const ok = await deleteDeployment(seed!.id);
    expect(ok).toBe(true); // see comment above — silent no-op

    const row = await db.query.deployments.findFirst({
      where: eq(deployments.id, seed!.id),
    });
    expect(row).toBeDefined();
    expect(row?.userId).toBe(OWNER_ID);
  });

  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(deleteDeployment("anything")).rejects.toThrow(/unauthorized/i);
  });
});

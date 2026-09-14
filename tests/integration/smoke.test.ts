/**
 * Phase 3 smoke test — proves the Testcontainers + drizzle-kit-push
 * infrastructure works end-to-end. Inserts a user, reads it back, then
 * relies on the global afterEach TRUNCATE to clean up.
 *
 * If this passes, the integration test rig is healthy. If it fails,
 * something is wrong with the test-db helper, container, or schema push
 * — fix that before debugging individual service test failures.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { users } from "@/server/db/schema";
import { getTestDb } from "../helpers/test-db";

describe("integration smoke", () => {
  it("can insert and read a user against the testcontainer Postgres", async () => {
    const db = getTestDb();

    const [inserted] = await db
      .insert(users)
      .values({
        email: "smoke@shipkit.test",
        name: "Smoke Test",
      })
      .returning();

    expect(inserted).toBeDefined();
    expect(inserted?.email).toBe("smoke@shipkit.test");
    expect(inserted?.id).toBeTruthy();

    const found = await db.query.users.findFirst({
      where: eq(users.email, "smoke@shipkit.test"),
    });
    expect(found?.id).toBe(inserted?.id);
  });

  it("afterEach truncates between tests (no rows from previous test)", async () => {
    const db = getTestDb();
    const all = await db.select().from(users);
    expect(all.length).toBe(0);
  });
});

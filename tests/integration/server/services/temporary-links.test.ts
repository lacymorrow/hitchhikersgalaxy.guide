/**
 * Phase 4.3 — FAILING tests that become the spec for plan 005
 * (temporary links: one-time use, stop extending expiry on read).
 *
 * Each test in the "AFTER plan 005" block is marked with `.fails` so
 * it asserts the EXPECTED future behavior. When plan 005 lands the
 * `.fails` modifier should be removed in the SAME PR.
 *
 * The "CURRENT behavior" block pins what the code does today so any
 * accidental change shows up here first.
 *
 * Service contract today (src/server/services/temporary-links.ts):
 *   - getTemporaryLinkData reads the row, RESETS expiresAt to +30min on
 *     every successful read, and does NOT record a use count.
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { temporaryLinks, users } from "@/server/db/schema";
import { createTemporaryLink, getTemporaryLinkData } from "@/server/services/temporary-links";
import { getTestDb } from "../../../helpers/test-db";

const OWNER_ID = "tl-owner";

beforeEach(async () => {
  vi.useRealTimers();
  const db = getTestDb();
  await db.insert(users).values({ id: OWNER_ID, email: "tl-owner@shipkit.test" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createTemporaryLink / getTemporaryLinkData — CURRENT behavior", () => {
  it("createTemporaryLink inserts a row visible by id+owner before expiry", async () => {
    const [created] = (await createTemporaryLink({
      data: "secret-payload",
      userId: OWNER_ID,
      type: "password-reset",
    })) as { id: string; expiresAt: Date }[];
    expect(created?.id).toBeTruthy();
    expect(created?.expiresAt).toBeInstanceOf(Date);

    const data = await getTemporaryLinkData(created!.id, OWNER_ID);
    expect(data).toBe("secret-payload");
  });

  it("returns null when the link belongs to a different user (id+userId scope)", async () => {
    const [link] = (await createTemporaryLink({
      data: "for-owner",
      userId: OWNER_ID,
      type: "x",
    })) as { id: string }[];

    const data = await getTemporaryLinkData(link!.id, "someone-else");
    expect(data).toBeNull();
  });

  it("returns null after the link has expired (no clock-reset on expired reads)", async () => {
    const [link] = (await createTemporaryLink({
      data: "expired-payload",
      userId: OWNER_ID,
      type: "x",
      expiresInMinutes: 1,
    })) as { id: string }[];

    // Force the row to be expired without faking timers (drizzle's gt()
    // compares to `new Date()` inside the service).
    const db = getTestDb();
    await db
      .update(temporaryLinks)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(temporaryLinks.id, link!.id));

    const data = await getTemporaryLinkData(link!.id, OWNER_ID);
    expect(data).toBeNull();
  });
});

describe("plan 005 SPEC — temporary links are one-time-use and don't extend on read", () => {
  /**
   * Today the code reads the row, then UPDATES expiresAt to "+30 min from
   * now". A second read 29 minutes later still succeeds. We pin the
   * desired future behavior with `.fails` so the assertion documents what
   * plan 005 must achieve; remove `.fails` in the plan-005 PR.
   */
  it.fails("second read of the same link returns null (one-time-use)", async () => {
    const [link] = (await createTemporaryLink({
      data: "one-time-payload",
      userId: OWNER_ID,
      type: "magic-link",
    })) as { id: string }[];

    const first = await getTemporaryLinkData(link!.id, OWNER_ID);
    expect(first).toBe("one-time-payload");

    const second = await getTemporaryLinkData(link!.id, OWNER_ID);
    expect(second).toBeNull(); // FAILS today: returns "one-time-payload" again
  });

  it.fails("reading a link does NOT extend its expiresAt past the original value", async () => {
    const [link] = (await createTemporaryLink({
      data: "no-extend-payload",
      userId: OWNER_ID,
      type: "magic-link",
      expiresInMinutes: 5,
    })) as { id: string; expiresAt: Date }[];

    const originalExpiresAt = link!.expiresAt.getTime();

    await getTemporaryLinkData(link!.id, OWNER_ID);

    const db = getTestDb();
    const after = await db.query.temporaryLinks.findFirst({
      where: eq(temporaryLinks.id, link!.id),
    });

    // Today the service updates expiresAt to "+30 min from now" on
    // every successful read. After plan 005 the row should be
    // consumed or its expiresAt should not move forward.
    expect(after?.expiresAt.getTime()).toBeLessThanOrEqual(originalExpiresAt);
  });
});

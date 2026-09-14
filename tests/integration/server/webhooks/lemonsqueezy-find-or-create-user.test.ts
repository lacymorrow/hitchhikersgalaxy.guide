/**
 * Plan 002 — LemonSqueezy webhook IDOR via `custom_data.user_id`.
 *
 * Before plan 002, the webhook handler trusted `custom_data.user_id`
 * (which is fully attacker-controllable via the checkout query string)
 * without checking whether the hinted user owned the verified billing
 * email. An attacker could pay for product X with custom_data.user_id
 * set to a victim's id and have access provisioned to the victim.
 *
 * These tests pin the post-fix contract: the hint is honored ONLY when
 * the hinted user's email matches the webhook's verified email.
 */
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findOrCreateUser } from "@/app/(app)/webhooks/lemonsqueezy/route";
import { users } from "@/server/db/schema";
import { getTestDb } from "../../../helpers/test-db";

const VICTIM_ID = "victim-user-id";
const VICTIM_EMAIL = "victim@example.com";
const ATTACKER_EMAIL = "attacker@evil.com";

async function seedUser(id: string, email: string) {
  await getTestDb().insert(users).values({ id, email: email.toLowerCase() });
}

async function userEmail(id: string): Promise<string | undefined> {
  const row = await getTestDb().query.users.findFirst({ where: eq(users.id, id) });
  return row?.email;
}

describe("LemonSqueezy webhook findOrCreateUser — plan 002 (IDOR fix)", () => {
  beforeEach(async () => {
    await seedUser(VICTIM_ID, VICTIM_EMAIL);
  });

  afterEach(async () => {
    // The integration setup truncates between tests but be explicit so a
    // future change to setup-integration.ts can't silently re-introduce the
    // cross-test leak that would mask the IDOR.
  });

  it("REJECTS a custom_data.user_id whose email does not match the webhook email", async () => {
    // The classic IDOR payload: attacker pays as themselves but supplies the
    // victim's user_id as the hint. Before the fix this returned VICTIM_ID
    // (the bug). Post-fix it falls through to email lookup and creates a
    // new attacker-owned row.
    const resolvedId = await findOrCreateUser(ATTACKER_EMAIL, null, { user_id: VICTIM_ID });

    expect(resolvedId, "must NOT resolve to the victim").not.toBe(VICTIM_ID);
    const resolvedEmail = await userEmail(resolvedId);
    expect(resolvedEmail).toBe(ATTACKER_EMAIL.toLowerCase());
  });

  it("HONORS a custom_data.user_id whose email matches the webhook email", async () => {
    // The legitimate use of the hint: the checkout-creation flow passes the
    // signed-in user's id, and the webhook email is that user's email.
    const resolvedId = await findOrCreateUser(VICTIM_EMAIL, null, { user_id: VICTIM_ID });
    expect(resolvedId).toBe(VICTIM_ID);
  });

  it("case-folds the email comparison (LemonSqueezy sends mixed case)", async () => {
    // Webhook may send "Victim@Example.com" while the row stores
    // "victim@example.com". The fix must compare case-insensitively or it
    // becomes a regression that breaks the legitimate hint path.
    const resolvedId = await findOrCreateUser("Victim@Example.COM", null, { user_id: VICTIM_ID });
    expect(resolvedId).toBe(VICTIM_ID);
  });

  it("falls through to email lookup when custom_data is undefined (no hint)", async () => {
    const resolvedId = await findOrCreateUser(VICTIM_EMAIL, null, undefined);
    expect(resolvedId).toBe(VICTIM_ID);
  });

  it("falls through to email lookup when custom_data.user_id points at a nonexistent row", async () => {
    // Stale or fabricated hint that doesn't match any user — must not throw,
    // must not create using the bogus id; instead the email path takes over.
    const resolvedId = await findOrCreateUser(VICTIM_EMAIL, null, {
      user_id: "no-such-user-anywhere",
    });
    expect(resolvedId).toBe(VICTIM_ID);
  });
});

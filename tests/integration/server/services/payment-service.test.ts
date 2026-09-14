/**
 * Characterization tests for payment-service against the live Testcontainers
 * DB. The provider-side paths (Lemon Squeezy / Stripe / Polar) aren't
 * configured in the test env, so this suite focuses on the DB layer:
 * persistence, idempotency, metadata fallbacks, and the joins that plan
 * 007 (N+1 refactor) will rewrite.
 *
 * These tests are the SPEC for plans 002 / 004 / 007 — when those land,
 * change a test in the same PR; never silently delete one.
 *
 * Not covered here (deferred to Phase 4.3):
 *   - LemonSqueezy custom_data.user_id IDOR (plan 002)
 *   - Webhook idempotency across all three providers (plan 004)
 */

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { payments, users } from "@/server/db/schema";
import { PaymentService as paymentService } from "@/server/services/payment-service";
import { getTestDb } from "../../../helpers/test-db";

async function seedUser(opts: { id: string; email: string; name?: string }) {
  const db = getTestDb();
  await db.insert(users).values({ id: opts.id, email: opts.email, name: opts.name });
}

afterEach(() => {
  // Truncate handled globally in setup-integration.ts
});

describe("paymentService.createPayment", () => {
  it("inserts a new payment row and returns it", async () => {
    await seedUser({ id: "user-create-1", email: "create1@shipkit.test" });

    const result = await paymentService.createPayment({
      userId: "user-create-1",
      orderId: "ORDER-001",
      amount: 4999,
      status: "paid",
      processor: "stripe",
      metadata: { source: "checkout-test" },
    });

    expect(result).toBeDefined();
    expect(result?.userId).toBe("user-create-1");
    expect(result?.orderId).toBe("ORDER-001");
    expect(result?.processorOrderId).toBe("ORDER-001");
    expect(result?.amount).toBe(4999);
    expect(result?.status).toBe("paid");
    expect(result?.processor).toBe("stripe");
    expect(result?.isFreeProduct).toBe(false);
    expect(JSON.parse(result?.metadata ?? "{}")).toEqual({
      source: "checkout-test",
    });
  });

  it("is idempotent on orderId — second call returns the existing row, no duplicate", async () => {
    await seedUser({ id: "user-create-2", email: "create2@shipkit.test" });

    const first = await paymentService.createPayment({
      userId: "user-create-2",
      orderId: "ORDER-DUPE",
      amount: 100,
      status: "paid",
      processor: "stripe",
    });

    const second = await paymentService.createPayment({
      userId: "user-create-2",
      orderId: "ORDER-DUPE",
      amount: 999_999, // would differ if a fresh row were inserted
      status: "refunded",
      processor: "polar",
    });

    expect(second?.id).toBe(first?.id);
    expect(second?.amount).toBe(100); // unchanged — returned the existing row

    // Confirm only one row exists for this orderId
    const db = getTestDb();
    const rows = await db.select().from(payments).where(eq(payments.orderId, "ORDER-DUPE"));
    expect(rows).toHaveLength(1);
  });

  it("defaults processor to 'unknown' and isFreeProduct to false", async () => {
    await seedUser({ id: "user-create-3", email: "create3@shipkit.test" });
    const result = await paymentService.createPayment({
      userId: "user-create-3",
      orderId: "ORDER-DEFAULTS",
      amount: 0,
      status: "paid",
    });
    expect(result?.processor).toBe("unknown");
    expect(result?.isFreeProduct).toBe(false);
  });

  it("serializes empty metadata as '{}'", async () => {
    await seedUser({ id: "user-create-4", email: "create4@shipkit.test" });
    const result = await paymentService.createPayment({
      userId: "user-create-4",
      orderId: "ORDER-EMPTY-META",
      amount: 100,
      status: "paid",
    });
    expect(result?.metadata).toBe("{}");
  });
});

describe("paymentService.updatePaymentStatus", () => {
  it("updates the status of a payment by orderId", async () => {
    await seedUser({ id: "user-update-1", email: "update1@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-update-1",
      orderId: "ORDER-UPDATE",
      amount: 100,
      status: "pending",
    });

    const updated = await paymentService.updatePaymentStatus("ORDER-UPDATE", "paid");
    expect(updated?.status).toBe("paid");
    expect(updated?.orderId).toBe("ORDER-UPDATE");
  });

  it("returns null for a non-existent orderId (does NOT throw)", async () => {
    const result = await paymentService.updatePaymentStatus("NO-SUCH-ORDER", "paid");
    expect(result).toBeNull();
  });
});

describe("paymentService.getPaymentByOrderId / getUserPayments", () => {
  it("getPaymentByOrderId returns the row for an existing orderId", async () => {
    await seedUser({ id: "user-fetch-1", email: "fetch1@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-fetch-1",
      orderId: "ORDER-FETCH",
      amount: 100,
      status: "paid",
    });

    const found = await paymentService.getPaymentByOrderId("ORDER-FETCH");
    expect(found?.orderId).toBe("ORDER-FETCH");
    expect(found?.userId).toBe("user-fetch-1");
  });

  it("getPaymentByOrderId returns null for a non-existent orderId", async () => {
    const result = await paymentService.getPaymentByOrderId("NO-SUCH-ORDER");
    expect(result).toBeNull();
  });

  it("getUserPayments returns all payments for a user, ordered by createdAt asc", async () => {
    await seedUser({ id: "user-list-1", email: "list1@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-list-1",
      orderId: "ORDER-A",
      amount: 100,
      status: "paid",
    });
    await new Promise((r) => setTimeout(r, 10));
    await paymentService.createPayment({
      userId: "user-list-1",
      orderId: "ORDER-B",
      amount: 200,
      status: "paid",
    });

    const list = await paymentService.getUserPayments("user-list-1");
    expect(list).toHaveLength(2);
    expect(list[0]?.orderId).toBe("ORDER-A");
    expect(list[1]?.orderId).toBe("ORDER-B");
  });

  it("getUserPayments returns empty array for a user with no payments", async () => {
    await seedUser({ id: "user-empty", email: "empty@shipkit.test" });
    const list = await paymentService.getUserPayments("user-empty");
    expect(list).toEqual([]);
  });
});

describe("paymentService.hasUserPurchasedVariant — DB branch", () => {
  it("returns true when variant_id matches in metadata", async () => {
    await seedUser({ id: "user-vp-1", email: "vp1@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-vp-1",
      orderId: "ORDER-VARIANT",
      amount: 100,
      status: "paid",
      metadata: { variant_id: "777" },
    });

    const ok = await paymentService.hasUserPurchasedVariant({
      userId: "user-vp-1",
      variantId: "777",
    });
    expect(ok).toBe(true);
  });

  it("returns true when variantId (camelCase) matches in metadata", async () => {
    await seedUser({ id: "user-vp-2", email: "vp2@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-vp-2",
      orderId: "ORDER-VARIANT-CC",
      amount: 100,
      status: "paid",
      metadata: { variantId: 888 }, // stored as number
    });

    const ok = await paymentService.hasUserPurchasedVariant({
      userId: "user-vp-2",
      variantId: "888", // requested as string — service does String() coercion
    });
    expect(ok).toBe(true);
  });

  it("returns false when no payment metadata matches", async () => {
    await seedUser({ id: "user-vp-3", email: "vp3@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-vp-3",
      orderId: "ORDER-NO-VARIANT",
      amount: 100,
      status: "paid",
      metadata: { variant_id: "111" },
    });
    const ok = await paymentService.hasUserPurchasedVariant({
      userId: "user-vp-3",
      variantId: "999",
    });
    expect(ok).toBe(false);
  });

  it("returns false when user does not exist", async () => {
    const ok = await paymentService.hasUserPurchasedVariant({
      userId: "nonexistent-user",
      variantId: "777",
    });
    expect(ok).toBe(false);
  });
});

describe("paymentService.hasUserPurchasedProduct — DB branch", () => {
  it("matches via metadata.productId", async () => {
    await seedUser({ id: "user-pp-1", email: "pp1@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-pp-1",
      orderId: "ORDER-PRODUCT",
      amount: 100,
      status: "paid",
      metadata: { productId: "prod-42" },
    });
    const ok = await paymentService.hasUserPurchasedProduct({
      userId: "user-pp-1",
      productId: "prod-42",
    });
    expect(ok).toBe(true);
  });

  it("matches via metadata.product_id (snake_case)", async () => {
    await seedUser({ id: "user-pp-2", email: "pp2@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-pp-2",
      orderId: "ORDER-PRODUCT-SC",
      amount: 100,
      status: "paid",
      metadata: { product_id: "prod-43" },
    });
    const ok = await paymentService.hasUserPurchasedProduct({
      userId: "user-pp-2",
      productId: "prod-43",
    });
    expect(ok).toBe(true);
  });

  it("matches via metadata.productName substring", async () => {
    await seedUser({ id: "user-pp-3", email: "pp3@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-pp-3",
      orderId: "ORDER-PRODUCT-NAME",
      amount: 100,
      status: "paid",
      metadata: { productName: "Shipkit Pro Bundle" },
    });
    const ok = await paymentService.hasUserPurchasedProduct({
      userId: "user-pp-3",
      productId: "Pro Bundle",
    });
    expect(ok).toBe(true);
  });

  it("returns false on malformed metadata (catches JSON.parse error per row)", async () => {
    await seedUser({ id: "user-pp-4", email: "pp4@shipkit.test" });
    const db = getTestDb();
    // Bypass createPayment to inject deliberately bad metadata
    await db.insert(payments).values({
      userId: "user-pp-4",
      orderId: "ORDER-BAD-META",
      processorOrderId: "ORDER-BAD-META",
      amount: 100,
      status: "paid",
      metadata: "this-is-not-valid-json",
    });

    const ok = await paymentService.hasUserPurchasedProduct({
      userId: "user-pp-4",
      productId: "anything",
    });
    expect(ok).toBe(false);
  });
});

describe("paymentService.getPaymentsWithUsers — DB-only branch (no providers)", () => {
  it("returns empty array when no payments exist", async () => {
    const result = await paymentService.getPaymentsWithUsers();
    expect(result).toEqual([]);
  });

  it("hydrates user email/name from the users table and converts amount cents→dollars", async () => {
    await seedUser({
      id: "user-pwu-1",
      email: "pwu1@shipkit.test",
      name: "Alice",
    });
    await paymentService.createPayment({
      userId: "user-pwu-1",
      orderId: "ORDER-PWU-1",
      amount: 4999, // cents
      status: "paid",
      processor: "stripe",
      metadata: { productName: "Shipkit Pro" },
    });

    const result = await paymentService.getPaymentsWithUsers();
    expect(result).toHaveLength(1);
    expect(result[0]?.userEmail).toBe("pwu1@shipkit.test");
    expect(result[0]?.userName).toBe("Alice");
    expect(result[0]?.amount).toBe(49.99); // cents converted to dollars
    expect(result[0]?.productName).toBe("Shipkit Pro");
    expect(result[0]?.isInDatabase).toBe(true);
    expect(result[0]?.processor).toBe("stripe");
  });

  it("falls back to 'unknown@example.com' when the user row is missing", async () => {
    // Insert a payment row pointing at a userId that has no users row.
    // (No FK exists on payments.userId in the current schema.)
    const db = getTestDb();
    await db.insert(payments).values({
      userId: "orphaned-user-id",
      orderId: "ORDER-ORPHAN",
      processorOrderId: "ORDER-ORPHAN",
      amount: 100,
      status: "paid",
      processor: "stripe",
    });

    const result = await paymentService.getPaymentsWithUsers();
    expect(result[0]?.userEmail).toBe("unknown@example.com");
    expect(result[0]?.userName).toBeNull();
  });

  it("metadata productName fallback chain: productName → product_name → variant_name → 'Unknown Product'", async () => {
    await seedUser({ id: "user-pwu-2", email: "pwu2@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-pwu-2",
      orderId: "ORDER-PWU-FB1",
      amount: 100,
      status: "paid",
      metadata: { variant_name: "Pro Plan" },
    });

    const result = await paymentService.getPaymentsWithUsers();
    const row = result.find((r) => r.orderId === "ORDER-PWU-FB1");
    expect(row?.productName).toBe("Pro Plan");
  });

  it("prefers the payments.productName column over metadata when both are present", async () => {
    await seedUser({ id: "user-pwu-3", email: "pwu3@shipkit.test" });
    const db = getTestDb();
    await db.insert(payments).values({
      userId: "user-pwu-3",
      orderId: "ORDER-PWU-DIRECT",
      processorOrderId: "ORDER-PWU-DIRECT",
      amount: 100,
      status: "paid",
      processor: "stripe",
      productName: "Direct Column Name", // takes priority
      metadata: JSON.stringify({ productName: "Metadata Name" }),
    });

    const result = await paymentService.getPaymentsWithUsers();
    const row = result.find((r) => r.orderId === "ORDER-PWU-DIRECT");
    expect(row?.productName).toBe("Direct Column Name");
  });

  it("uses 'Unknown Product' default when no productName source is set", async () => {
    await seedUser({ id: "user-pwu-4", email: "pwu4@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-pwu-4",
      orderId: "ORDER-PWU-UNKNOWN",
      amount: 100,
      status: "paid",
    });

    const result = await paymentService.getPaymentsWithUsers();
    const row = result.find((r) => r.orderId === "ORDER-PWU-UNKNOWN");
    expect(row?.productName).toBe("Unknown Product");
  });

  it("returns rows sorted by purchaseDate (desc): newest first", async () => {
    await seedUser({ id: "user-pwu-5", email: "pwu5@shipkit.test" });
    await paymentService.createPayment({
      userId: "user-pwu-5",
      orderId: "ORDER-SORT-OLD",
      amount: 100,
      status: "paid",
    });
    await new Promise((r) => setTimeout(r, 50));
    await paymentService.createPayment({
      userId: "user-pwu-5",
      orderId: "ORDER-SORT-NEW",
      amount: 200,
      status: "paid",
    });

    const result = await paymentService.getPaymentsWithUsers();
    expect(result[0]?.orderId).toBe("ORDER-SORT-NEW");
    expect(result[1]?.orderId).toBe("ORDER-SORT-OLD");
  });

  it("DOCUMENTS N+1: scans every payment with a JS Array.find against allUsers — replaced by SQL JOIN in plan 007", async () => {
    // This test pins the current behavior: `getPaymentsWithUsers` selects
    // all users + all payments and joins in memory with allUsers.find().
    // Plan 007 replaces this with a SQL JOIN. When that lands, this test
    // is still valid (output unchanged) but should be DELETED in the
    // same PR to avoid documenting an obsolete characterization.
    await seedUser({ id: "u1", email: "u1@shipkit.test" });
    await seedUser({ id: "u2", email: "u2@shipkit.test" });
    await paymentService.createPayment({
      userId: "u1",
      orderId: "ORDER-N1-A",
      amount: 100,
      status: "paid",
    });
    await paymentService.createPayment({
      userId: "u2",
      orderId: "ORDER-N1-B",
      amount: 200,
      status: "paid",
    });

    const result = await paymentService.getPaymentsWithUsers();
    expect(result.map((r) => r.userEmail).sort()).toEqual(["u1@shipkit.test", "u2@shipkit.test"]);
  });
});

describe("paymentService.getUsersWithPayments — DB-only branch (no providers)", () => {
  it("returns empty array when no users exist", async () => {
    const result = await paymentService.getUsersWithPayments();
    expect(result).toEqual([]);
  });

  it("returns one entry per user, aggregating their payments", async () => {
    await seedUser({
      id: "user-uwp-1",
      email: "uwp1@shipkit.test",
      name: "Alice",
    });
    await paymentService.createPayment({
      userId: "user-uwp-1",
      orderId: "ORDER-UWP-1",
      amount: 100,
      status: "paid",
    });
    await paymentService.createPayment({
      userId: "user-uwp-1",
      orderId: "ORDER-UWP-2",
      amount: 200,
      status: "paid",
    });

    const result = await paymentService.getUsersWithPayments();
    expect(result).toHaveLength(1);
    expect(result[0]?.email).toBe("uwp1@shipkit.test");
    expect(result[0]?.name).toBe("Alice");
    expect(result[0]?.purchases?.length).toBe(2);
  });
});

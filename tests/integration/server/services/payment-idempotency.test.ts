/**
 * Phase 4.3 — FAILING tests that become the spec for plan 004
 * (payment-webhook idempotency: DB unique constraint + transactional insert
 * with ON CONFLICT DO NOTHING).
 *
 * The webhook handlers use a check-then-insert pattern with no DB
 * uniqueness on `payments.orderId`. Two concurrent webhook deliveries
 * for the same order can both insert, creating duplicate payment rows.
 *
 * The tests in the "plan 004 SPEC" block are marked `.fails` because
 * they assert the post-fix behavior. Remove `.fails` in the plan-004
 * PR (which must also add the unique constraint).
 */

import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { payments, users } from "@/server/db/schema";
import { getTestDb } from "../../../helpers/test-db";

const USER_ID = "idem-user";
const ORDER_ID = "ORDER-DUPLICATED";

async function seedUser() {
  const db = getTestDb();
  await db.insert(users).values({ id: USER_ID, email: "idem@shipkit.test" });
}

describe("payments.orderId — CURRENT schema permits duplicates (the bug)", () => {
  it("plain double-INSERT of the same orderId succeeds and produces 2 rows", async () => {
    await seedUser();
    const db = getTestDb();

    await db.insert(payments).values({
      userId: USER_ID,
      orderId: ORDER_ID,
      processorOrderId: ORDER_ID,
      amount: 100,
      status: "paid",
      processor: "stripe",
    });

    // Today this SECOND insert succeeds — there is no UNIQUE constraint
    // on (orderId) or (processor, processorOrderId). After plan 004 this
    // should violate a unique constraint instead.
    await db.insert(payments).values({
      userId: USER_ID,
      orderId: ORDER_ID,
      processorOrderId: ORDER_ID,
      amount: 100,
      status: "paid",
      processor: "stripe",
    });

    const rows = await db
      .select()
      .from(payments)
      .where(sql`order_id = ${ORDER_ID}`);
    expect(rows.length).toBe(2);
  });
});

describe("plan 004 SPEC — payments table enforces orderId uniqueness", () => {
  it.fails("double-INSERT of the same orderId throws a unique-constraint error", async () => {
    await seedUser();
    const db = getTestDb();

    await db.insert(payments).values({
      userId: USER_ID,
      orderId: ORDER_ID,
      processorOrderId: ORDER_ID,
      amount: 100,
      status: "paid",
      processor: "stripe",
    });

    // Expected: this throws after plan 004 adds the unique index.
    await expect(
      db.insert(payments).values({
        userId: USER_ID,
        orderId: ORDER_ID,
        processorOrderId: ORDER_ID,
        amount: 100,
        status: "paid",
        processor: "stripe",
      })
    ).rejects.toThrow(/unique|duplicate/i);
  });

  it.fails("a UNIQUE index exists covering orderId", async () => {
    const db = getTestDb();
    // Look for any unique index on payments that includes order_id.
    const rows = await db.execute(sql`
      SELECT i.relname AS index_name
      FROM pg_index ix
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname LIKE '%payment%'
        AND ix.indisunique
        AND a.attname = 'order_id'
    `);
    expect(rows.length).toBeGreaterThan(0);
  });
});

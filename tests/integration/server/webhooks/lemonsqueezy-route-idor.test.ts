/**
 * Wire-path coverage for task #26: a signed LemonSqueezy webhook with a
 * malicious `custom_data.user_id` must NOT credit the victim user.
 *
 * The companion test at
 * `lemonsqueezy-find-or-create-user.test.ts` covers the helper directly.
 * This file exercises the full route handler — HMAC verify, JSON parse,
 * event routing into handleOrderCreated, and the payments insert — to
 * make sure no future change can re-introduce the IDOR by skipping the
 * findOrCreateUser check at a higher level (e.g. by reading user_id off
 * meta.custom_data in handleOrderCreated and inserting payments
 * directly).
 *
 * Strategy:
 *   - Set LEMONSQUEEZY_WEBHOOK_SECRET in process.env BEFORE importing the
 *     route module (the module reads env via @/env at import time).
 *   - Build an order_created payload, sign it with HMAC-SHA256, POST via
 *     the exported route handler.
 *   - Assert the payments row that gets created is bound to the
 *     attacker's email, not the victim's id.
 */
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Must match tests/setup-env.ts — the env is captured at @/env load time,
// which is before any code in this file runs.
const WEBHOOK_SECRET = "test-only-lemonsqueezy-webhook-secret";

// The default `tests/setup-env.ts` shim of `next/server` provides
// `NextResponse` as a plain object so unit tests don't pull in the full
// Next runtime. The webhook route uses `new NextResponse(...)`, which the
// shim can't satisfy — give it a Response-extending class here.
vi.mock("next/server", () => {
  class NextResponse extends Response {}
  return { NextResponse, NextRequest: Request };
});

import { payments, users } from "@/server/db/schema";
import { getTestDb, truncateAllTables } from "../../../helpers/test-db";

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  ({ POST } = await import("@/app/(app)/webhooks/lemonsqueezy/route"));
});

const VICTIM_ID = "victim-wire-user";
const VICTIM_EMAIL = "victim-wire@example.com";
const ATTACKER_EMAIL = "attacker-wire@evil.com";

function signedRequest(body: object, secret = WEBHOOK_SECRET): Request {
  const raw = JSON.stringify(body);
  const signature = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  return new Request("http://localhost/webhooks/lemonsqueezy", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": signature,
    },
    body: raw,
  });
}

function orderCreatedPayload(opts: {
  orderId: string;
  email: string;
  customUserId?: string;
}): object {
  return {
    meta: {
      event_name: "order_created",
      test_mode: true,
      custom_data: opts.customUserId ? { user_id: opts.customUserId } : undefined,
    },
    data: {
      type: "orders",
      id: opts.orderId,
      attributes: {
        user_email: opts.email,
        user_name: null,
        status: "paid",
        total: 24900,
        total_usd: 24900,
        currency: "USD",
        identifier: `ord-${opts.orderId}`,
        order_number: 1,
        customer_id: 9999,
        first_order_item: {
          product_id: 1,
          variant_id: 1,
          product_name: "Test Plan",
          variant_name: "Default",
        },
      },
    },
  };
}

async function paymentFor(orderId: string) {
  return await getTestDb().query.payments.findFirst({
    where: eq(payments.orderId, orderId),
  });
}

describe("POST /webhooks/lemonsqueezy — wire-path IDOR check (task #26)", () => {
  beforeEach(async () => {
    await getTestDb().insert(users).values({ id: VICTIM_ID, email: VICTIM_EMAIL.toLowerCase() });
  });

  afterEach(async () => {
    await truncateAllTables();
  });

  it("rejects malformed signature with 401", async () => {
    const body = orderCreatedPayload({ orderId: "ord-401", email: ATTACKER_EMAIL });
    const raw = JSON.stringify(body);
    const req = new Request("http://localhost/webhooks/lemonsqueezy", {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": "deadbeef" },
      body: raw,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("a signed order_created with a malicious custom_data.user_id does NOT credit the victim", async () => {
    const orderId = "ord-idor-1";
    const res = await POST(
      signedRequest(
        orderCreatedPayload({
          orderId,
          email: ATTACKER_EMAIL, // verified billing email = attacker
          customUserId: VICTIM_ID, // attacker-supplied hint = victim
        })
      )
    );
    expect(res.status).toBe(200);

    const payment = await paymentFor(orderId);
    expect(payment, "payment row must be inserted").toBeDefined();
    expect(payment!.userId, "payment must NOT be credited to the victim").not.toBe(VICTIM_ID);

    // Sanity-check the victim user is untouched (no payments).
    const victimPayments = await getTestDb().query.payments.findFirst({
      where: eq(payments.userId, VICTIM_ID),
    });
    expect(victimPayments, "victim must have no payments").toBeUndefined();
  });

  it("a signed order_created whose custom_data.user_id matches the buyer is honored", async () => {
    const orderId = "ord-legit-1";
    const res = await POST(
      signedRequest(
        orderCreatedPayload({
          orderId,
          email: VICTIM_EMAIL, // buyer = the same user as the hint
          customUserId: VICTIM_ID,
        })
      )
    );
    expect(res.status).toBe(200);

    const payment = await paymentFor(orderId);
    expect(payment?.userId).toBe(VICTIM_ID);
  });
});

/**
 * Characterization tests for feedback-service against the live
 * Testcontainers DB. Pins the current `FeedbackResult` contract so any
 * future refactor (e.g. plan 007 N+1 / pagination work in adjacent
 * services) doesn't silently change the response shape.
 *
 * Service contract (from src/server/services/feedback-service.ts):
 *   - createFeedback NEVER throws for validation errors. It returns
 *     { success: false, error: string } for invalid input and
 *     { success: true, data?: row, requiresEmailFallback?: boolean,
 *       mailtoLink?: string } for valid input.
 *   - updateFeedbackStatus throws on invalid status (not validated as a
 *     Result), returns the updated row (or undefined if no row matched).
 */

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { feedback } from "@/server/db/schema";
import { createFeedback, updateFeedbackStatus } from "@/server/services/feedback-service";
import { getTestDb } from "../../../helpers/test-db";

const opts = { skipEmail: true };

describe("feedback-service createFeedback", () => {
  it("returns success+data for a valid dialog feedback", async () => {
    const result = await createFeedback({ content: "Test feedback", source: "dialog" }, opts);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data?.content).toBe("Test feedback");
    expect(result.data?.source).toBe("dialog");
    expect(result.data?.metadata).toBe("{}");
    expect(result.data?.createdAt).toBeInstanceOf(Date);
  });

  it("serializes metadata to a JSON string", async () => {
    const metadata = { key: "value", count: 3 };
    const result = await createFeedback(
      { content: "with metadata", source: "dialog", metadata },
      opts
    );

    expect(result.success).toBe(true);
    expect(result.data?.metadata).toBe(JSON.stringify(metadata));
  });

  it("accepts the maximum-length content (1000 chars)", async () => {
    const content = "a".repeat(1000);
    const result = await createFeedback({ content, source: "popover" }, opts);

    expect(result.success).toBe(true);
    expect(result.data?.content).toBe(content);
  });

  it("preserves unicode and special characters", async () => {
    const content = "🚀 special: @#$%^&*() / 中文 / null bytes are fine";
    const result = await createFeedback({ content, source: "dialog" }, opts);

    expect(result.success).toBe(true);
    expect(result.data?.content).toBe(content);
  });

  it("persists the row to the database (visible on requery)", async () => {
    const result = await createFeedback({ content: "persisted row check", source: "dialog" }, opts);
    expect(result.success).toBe(true);
    const id = result.data?.id;
    expect(id).toBeTruthy();

    const db = getTestDb();
    const row = await db.query.feedback.findFirst({
      where: eq(feedback.id, id as string),
    });
    expect(row?.content).toBe("persisted row check");
  });

  it("returns success:false for empty content (no throw)", async () => {
    const result = await createFeedback({ content: "", source: "dialog" }, opts);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/required/i);
    expect(result.data).toBeUndefined();
  });

  it("returns success:false for content > 1000 chars", async () => {
    const result = await createFeedback({ content: "x".repeat(1001), source: "dialog" }, opts);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/too long/i);
  });

  it("returns success:false for invalid source (no throw)", async () => {
    const result = await createFeedback(
      { content: "valid content", source: "invalid" as never },
      opts
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid feedback source/i);
  });

  it("returns success:false when metadata has > 10 keys", async () => {
    const tooManyKeys: Record<string, number> = {};
    for (let i = 0; i < 11; i++) tooManyKeys[`k${i}`] = i;
    const result = await createFeedback(
      { content: "ok", source: "dialog", metadata: tooManyKeys },
      opts
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/more than 10/i);
  });
});

describe("feedback-service updateFeedbackStatus", () => {
  it("flips status from default to reviewed", async () => {
    const created = await createFeedback({ content: "to be reviewed", source: "dialog" }, opts);
    expect(created.success).toBe(true);
    const id = created.data?.id as string;

    const updated = await updateFeedbackStatus(id, "reviewed");
    expect(updated).toBeDefined();
    expect(updated?.status).toBe("reviewed");
    expect(updated?.updatedAt).toBeInstanceOf(Date);
  });

  it("returns undefined for a non-existent id (no throw)", async () => {
    const result = await updateFeedbackStatus("00000000-0000-0000-0000-000000000000", "reviewed");
    expect(result).toBeUndefined();
  });

  it("throws on invalid status (the one branch that DOES throw)", async () => {
    const created = await createFeedback({ content: "valid", source: "dialog" }, opts);
    const id = created.data?.id as string;

    await expect(updateFeedbackStatus(id, "not-a-real-status")).rejects.toThrow(
      /invalid feedback status/i
    );
  });
});

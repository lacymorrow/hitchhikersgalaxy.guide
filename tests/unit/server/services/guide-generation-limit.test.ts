/**
 * Regression tests for LAC-5648: the OpenAI spend cap must fail closed.
 *
 * The global cap is a count of rows written in the last hour, read from the
 * same database the slug page reads entries from. Its catch returned `true`,
 * so the one failure that blinds the cap -- an unreachable database -- was
 * also the failure that sent every entry URL down the generation path, with
 * nothing left to bound the bill. A crawler sweep multiplied that by the
 * number of indexed entries.
 *
 * Blind means stop. Do not relax these to `.toBe(true)`.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  checkLimit: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => mocks.count() }) }),
  },
}));

// Keep the per-IP layer out of the way: it is a separate decision, and which
// branch it takes depends on whether Upstash is configured in the env the
// suite happens to load.
vi.mock("@/server/services/rate-limit-service", () => ({
  rateLimitService: { checkLimit: mocks.checkLimit },
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => null }),
}));

const quotaError = () => {
  const error = new Error(
    "Your account or project has exceeded the quota. Upgrade your plan to increase limits."
  );
  (error as Error & { code?: string }).code = "53000";
  return error;
};

/** Importing the service pulls Drizzle and the schema through the transform,
 *  which costs more than the default per-test timeout. Do it once. */
let allowGuideCreation: typeof import("@/server/services/guide-generation-limit").allowGuideCreation;

beforeAll(async () => {
  ({ allowGuideCreation } = await import("@/server/services/guide-generation-limit"));
}, 60_000);

describe("allowGuideCreation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkLimit.mockResolvedValue(undefined);
  });

  it("refuses creation when the hourly count cannot be read", async () => {
    mocks.count.mockRejectedValue(quotaError());
    await expect(allowGuideCreation()).resolves.toBe(false);
  });

  it("refuses creation once the hourly cap is reached", async () => {
    mocks.count.mockResolvedValue([{ count: 60 }]);
    await expect(allowGuideCreation()).resolves.toBe(false);
  });

  it("allows creation with room under the cap", async () => {
    mocks.count.mockResolvedValue([{ count: 3 }]);
    await expect(allowGuideCreation()).resolves.toBe(true);
  });
});

describe("allowGuideCreation with no database configured", () => {
  // Needs its own module instance, since `db` is read at import time.
  it("refuses creation rather than assuming the cap is clear", async () => {
    vi.resetModules();
    vi.doMock("@/server/db", () => ({ db: undefined }));
    const fresh = await import("@/server/services/guide-generation-limit");
    await expect(fresh.allowGuideCreation()).resolves.toBe(false);
    vi.doUnmock("@/server/db");
    vi.resetModules();
  }, 60_000);
});

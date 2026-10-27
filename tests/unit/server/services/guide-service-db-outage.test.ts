/**
 * Regression tests for LAC-5405: a database outage must not fail the build.
 *
 * `/popular` prerenders `guideService.getPopularEntries()`. Every read in the
 * service was wrapped in try/catch, but each one `return`ed the query promise
 * instead of awaiting it, so the promise settled after the try block had
 * already exited and the catch never ran. The rejection surfaced in the page,
 * and `next build` died with "Error occurred prerendering page /popular"
 * whenever Postgres was unreachable -- which is how the Neon free-plan quota
 * blocked the next 16.3.8 security deploy (GHSA-vcvr-r3jv-pc5j) from reaching
 * production.
 *
 * Each read is expected to resolve to its documented failure value so pages
 * can render a state instead of crashing the prerender. Resolving, not
 * rejecting, is the whole point: do not relax these to `.rejects`.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  execute: vi.fn(),
  isSSR: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    query: { guideEntries: { findMany: mocks.findMany, findFirst: mocks.findFirst } },
    execute: mocks.execute,
  },
}));

vi.mock("@/lib/utils/runtime", () => ({
  isSSR: mocks.isSSR,
}));

const quotaError = () => {
  const error = new Error(
    "Your account or project has exceeded the quota. Upgrade your plan to increase limits."
  );
  (error as Error & { code?: string }).code = "53000";
  return error;
};

/** Importing the service pulls Drizzle and the schema through the transform,
 *  which on a cold cache costs more than the default per-test timeout. Doing
 *  it once here keeps whichever test runs first from flaking on that cost. */
let guideService: typeof import("@/server/services/guide-service").guideService;

beforeAll(async () => {
  ({ guideService } = await import("@/server/services/guide-service"));
}, 60_000);

describe("guideService under a database outage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The build renders on the server, which takes the non-similarity path.
    mocks.isSSR.mockReturnValue(true);
    mocks.findMany.mockRejectedValue(quotaError());
    mocks.findFirst.mockRejectedValue(quotaError());
    mocks.execute.mockRejectedValue(quotaError());
  });

  // These two report `unavailable` rather than `[]` so the pages can tell an
  // outage from an empty table (LAC-5520). Resolving is still the contract.
  it("resolves getPopularEntries rather than rejecting", async () => {
    await expect(guideService.getPopularEntries(20)).resolves.toEqual({ status: "unavailable" });
  });

  it("resolves getRecentEntries rather than rejecting", async () => {
    await expect(guideService.getRecentEntries(20)).resolves.toEqual({ status: "unavailable" });
  });

  it("resolves getSimilarSearches to an empty list rather than rejecting", async () => {
    await expect(guideService.getSimilarSearches("vogon poetry", 5)).resolves.toEqual([]);
  });

  // Also `unavailable` rather than a miss since LAC-5648: a `null` here sent
  // the slug page down the generation path, which paid OpenAI for an entry it
  // had merely failed to read. Resolving is still the contract.
  it("resolves findExistingEntry to unavailable rather than rejecting", async () => {
    await expect(guideService.findExistingEntry("vogon poetry")).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("resolves findExistingEntry to unavailable on the exact-match path", async () => {
    await expect(guideService.findExistingEntry("towel", true)).resolves.toEqual({
      status: "unavailable",
    });
  });
});

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
 * Each read is expected to resolve to its documented empty value so pages can
 * render their empty state. Resolving, not rejecting, is the whole point: do
 * not relax these to `.rejects`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("guideService under a database outage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The build renders on the server, which takes the non-similarity path.
    mocks.isSSR.mockReturnValue(true);
    mocks.findMany.mockRejectedValue(quotaError());
    mocks.findFirst.mockRejectedValue(quotaError());
    mocks.execute.mockRejectedValue(quotaError());
  });

  it("resolves getPopularEntries to an empty list rather than rejecting", async () => {
    const { guideService } = await import("@/server/services/guide-service");
    await expect(guideService.getPopularEntries(20)).resolves.toEqual([]);
  });

  it("resolves getRecentEntries to an empty list rather than rejecting", async () => {
    const { guideService } = await import("@/server/services/guide-service");
    await expect(guideService.getRecentEntries(20)).resolves.toEqual([]);
  });

  it("resolves getSimilarSearches to an empty list rather than rejecting", async () => {
    const { guideService } = await import("@/server/services/guide-service");
    await expect(guideService.getSimilarSearches("vogon poetry", 5)).resolves.toEqual([]);
  });

  it("resolves findExistingEntry to null rather than rejecting", async () => {
    const { guideService } = await import("@/server/services/guide-service");
    await expect(guideService.findExistingEntry("vogon poetry")).resolves.toBeNull();
  });

  it("resolves findExistingEntry to null on the exact-match path", async () => {
    const { guideService } = await import("@/server/services/guide-service");
    await expect(guideService.findExistingEntry("towel", true)).resolves.toBeNull();
  });
});

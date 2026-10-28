/**
 * Regression tests for LAC-5917: the guide reads cache across requests, and
 * only answers may be cached.
 *
 * Caching them is what lets the Neon compute suspend -- uncached crawler hits
 * on entry URLs held the endpoint awake around the clock, which spends the
 * free 100 CU-hour month in 16.7 days (LAC-5516). But the slug page generates
 * a missing entry *during render*, where `revalidateTag` cannot run. So a
 * cached "no row" would outlive the entry written moments later and 404 it for
 * a day, and a cached failed read would serve a false 404 long after the
 * database came back. Both are exactly the states this file pins open.
 *
 * The cache below is a stand-in for Next's data cache that records what it was
 * asked to store, and mirrors the two behaviours the invariant rests on:
 * `unstable_cache` stores the value its callback resolves to, serialized as
 * JSON, and stores nothing at all when the callback rejects.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const stored = new Map<string, string>();
  /** Every value the service asked the cache to keep, in order. */
  const writes: Array<{ key: string; tags?: string[]; revalidate?: number | false }> = [];

  return {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    isSSR: vi.fn(),
    stored,
    writes,
    unstable_cache:
      (
        read: (...args: unknown[]) => Promise<unknown>,
        keyParts: string[],
        options?: { tags?: string[]; revalidate?: number | false }
      ) =>
      async (...args: unknown[]) => {
        const key = JSON.stringify([keyParts, args]);
        const hit = stored.get(key);
        // A hit comes back off the wire as JSON, so its Dates are strings.
        if (hit !== undefined) return JSON.parse(hit);

        // A rejection escapes here, before the write below: that is the whole
        // reason throwing out of the callback keeps a miss out of the cache.
        const result = await read(...args);

        stored.set(key, JSON.stringify(result));
        writes.push({ key, tags: options?.tags, revalidate: options?.revalidate });
        // The real one returns the fresh value itself, not a round trip of it.
        return result;
      },
  };
});

vi.mock("@/server/db", () => ({
  db: { query: { guideEntries: { findMany: mocks.findMany, findFirst: mocks.findFirst } } },
}));

vi.mock("@/lib/utils/runtime", () => ({ isSSR: mocks.isSSR }));

vi.mock("next/cache", () => ({ unstable_cache: mocks.unstable_cache }));

const quotaError = () => {
  const error = new Error(
    "Your account or project has exceeded the quota. Upgrade your plan to increase limits."
  );
  (error as Error & { code?: string }).code = "53000";
  return error;
};

const entry = {
  id: "1",
  searchTerm: "towel",
  content: "Carry one.",
  popularity: 42,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-02T00:00:00.000Z"),
};

/** Importing the service pulls Drizzle and the schema through the transform,
 *  which costs more than the default per-test timeout. Do it once. */
let guideService: typeof import("@/server/services/guide-service").guideService;

beforeAll(async () => {
  ({ guideService } = await import("@/server/services/guide-service"));
}, 60_000);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.stored.clear();
  mocks.writes.length = 0;
  mocks.isSSR.mockReturnValue(true);
});

describe("guideService.findExistingEntry caching", () => {
  it("does not cache a term with no row, so the entry generated next is read back", async () => {
    mocks.findFirst.mockResolvedValue(undefined);

    await expect(guideService.findExistingEntry("towel", true)).resolves.toEqual({
      status: "ok",
      data: null,
    });
    expect(mocks.writes).toEqual([]);

    // The row the slug page just generated. A cached miss would hide it.
    mocks.findFirst.mockResolvedValue(entry);
    await expect(guideService.findExistingEntry("towel", true)).resolves.toEqual({
      status: "ok",
      data: entry,
    });
    expect(mocks.findFirst).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed read, so an outage cannot serve a false 404", async () => {
    mocks.findFirst.mockRejectedValue(quotaError());

    await expect(guideService.findExistingEntry("towel", true)).resolves.toEqual({
      status: "unavailable",
    });
    expect(mocks.writes).toEqual([]);

    // Database back. The outage must not have been written over the entry.
    mocks.findFirst.mockResolvedValue(entry);
    await expect(guideService.findExistingEntry("towel", true)).resolves.toEqual({
      status: "ok",
      data: entry,
    });
  });

  it("caches a stored entry, tagged so a write can purge it", async () => {
    mocks.findFirst.mockResolvedValue(entry);

    await expect(guideService.findExistingEntry("towel", true)).resolves.toEqual({
      status: "ok",
      data: entry,
    });
    await expect(guideService.findExistingEntry("towel", true)).resolves.toEqual({
      status: "ok",
      data: entry,
    });

    expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    expect(mocks.writes).toHaveLength(1);
    expect(mocks.writes[0]?.tags).toEqual(["guide-entries"]);
    expect(mocks.writes[0]?.revalidate).toBe(60 * 60 * 24);
  });

  it("gives a cache hit the same Date fields as a fresh read", async () => {
    mocks.findFirst.mockResolvedValue(entry);

    await guideService.findExistingEntry("towel", true);
    const cached = await guideService.findExistingEntry("towel", true);

    // JSON brought these back as ISO strings; callers type them as Dates and
    // hand them to date-fns.
    expect(cached).toEqual({ status: "ok", data: entry });
    if (cached.status !== "ok" || !cached.data) throw new Error("expected the cached entry");
    expect(cached.data.createdAt).toBeInstanceOf(Date);
    expect(cached.data.updatedAt).toBeInstanceOf(Date);
  });

  it("caches each term separately", async () => {
    mocks.findFirst.mockResolvedValue(entry);
    await guideService.findExistingEntry("towel", true);
    await guideService.findExistingEntry("babel-fish", true);

    expect(mocks.findFirst).toHaveBeenCalledTimes(2);
    expect(mocks.writes).toHaveLength(2);
  });

  it("leaves the uncached similarity lookup alone", async () => {
    mocks.findFirst.mockResolvedValue(entry);

    // exactMatch false: a visitor's search, not a crawler's entry URL. It
    // also writes popularity, so it is not a cacheable read.
    await guideService.findExistingEntry("towel");
    await guideService.findExistingEntry("towel");

    expect(mocks.writes).toEqual([]);
  });
});

describe.each([
  ["getRecentEntries", (limit: number) => guideService.getRecentEntries(limit)],
  ["getPopularEntries", (limit: number) => guideService.getPopularEntries(limit)],
] as const)("guideService.%s caching", (_name, read) => {
  it("does not cache a failed read", async () => {
    mocks.findMany.mockRejectedValue(quotaError());

    await expect(read(20)).resolves.toEqual({ status: "unavailable" });
    expect(mocks.writes).toEqual([]);

    mocks.findMany.mockResolvedValue([entry]);
    await expect(read(20)).resolves.toEqual({ status: "ok", data: [entry] });
  });

  it("caches rows for an hour, tagged so a write can purge them", async () => {
    mocks.findMany.mockResolvedValue([entry]);

    await expect(read(20)).resolves.toEqual({ status: "ok", data: [entry] });
    const cached = await read(20);

    expect(cached).toEqual({ status: "ok", data: [entry] });
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.writes).toHaveLength(1);
    expect(mocks.writes[0]?.tags).toEqual(["guide-entries"]);
    expect(mocks.writes[0]?.revalidate).toBe(60 * 60);
    if (cached.status !== "ok") throw new Error("expected the cached rows");
    expect(cached.data[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("caches an empty table as an answer, since that is what the read found", async () => {
    mocks.findMany.mockResolvedValue([]);

    await expect(read(20)).resolves.toEqual({ status: "ok", data: [] });
    expect(mocks.writes).toHaveLength(1);
  });

  it("caches each limit separately", async () => {
    mocks.findMany.mockResolvedValue([entry]);
    await read(4);
    await read(20);

    expect(mocks.findMany).toHaveBeenCalledTimes(2);
    expect(mocks.writes).toHaveLength(2);
  });
});

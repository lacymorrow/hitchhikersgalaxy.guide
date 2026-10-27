/**
 * Regression tests for LAC-5520: an outage must not read as an empty table.
 *
 * LAC-5405 stopped the reads from rejecting, which is what unblocked the
 * build, but it made them resolve to `[]` on failure. `[]` is also what a
 * genuinely empty table resolves to, so `/popular` and the home marquee --
 * which already had empty-state copy -- told visitors "No entries yet. Start
 * exploring to create some!" while thousands of entries sat behind an
 * unreachable database, inviting the one action that could not work.
 *
 * The reads now resolve to a discriminated result so a caller has to decide
 * which case it is rendering. Resolving rather than rejecting is still the
 * contract from LAC-5405; see guide-service-db-outage.test.ts.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  isSSR: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: { query: { guideEntries: { findMany: mocks.findMany } } },
}));

vi.mock("@/lib/utils/runtime", () => ({ isSSR: mocks.isSSR }));

const quotaError = () => {
  const error = new Error(
    "Your account or project has exceeded the quota. Upgrade your plan to increase limits."
  );
  (error as Error & { code?: string }).code = "53000";
  return error;
};

const entry = { id: "1", searchTerm: "towel", content: "Carry one.", popularity: 42 };

type Service = typeof import("@/server/services/guide-service").guideService;

/** Importing the service pulls Drizzle and the schema through the transform,
 *  which costs more than the default per-test timeout. Do it once. */
let guideService: Service;

beforeAll(async () => {
  ({ guideService } = await import("@/server/services/guide-service"));
}, 60_000);

describe.each([
  ["getPopularEntries", (s: Service) => s.getPopularEntries(20)],
  ["getRecentEntries", (s: Service) => s.getRecentEntries(20)],
] as const)("guideService.%s", (_name, read) => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSSR.mockReturnValue(true);
  });

  it("reports a failed query as unavailable, not as an empty list", async () => {
    mocks.findMany.mockRejectedValue(quotaError());
    await expect(read(guideService)).resolves.toEqual({ status: "unavailable" });
  });

  it("reports a genuinely empty table as ok with no entries", async () => {
    mocks.findMany.mockResolvedValue([]);
    await expect(read(guideService)).resolves.toEqual({ status: "ok", data: [] });
  });

  it("reports rows as ok with the rows", async () => {
    mocks.findMany.mockResolvedValue([entry]);
    await expect(read(guideService)).resolves.toEqual({ status: "ok", data: [entry] });
  });
});

describe("guideService with no database configured", () => {
  // Needs its own module instance, since `db` is read at import time.
  it("reports unavailable rather than an empty list", async () => {
    vi.resetModules();
    vi.doMock("@/server/db", () => ({ db: undefined }));
    const fresh = (await import("@/server/services/guide-service")).guideService;
    await expect(fresh.getPopularEntries(20)).resolves.toEqual({ status: "unavailable" });
    await expect(fresh.getRecentEntries(20)).resolves.toEqual({ status: "unavailable" });
    vi.doUnmock("@/server/db");
    vi.resetModules();
  }, 60_000);
});

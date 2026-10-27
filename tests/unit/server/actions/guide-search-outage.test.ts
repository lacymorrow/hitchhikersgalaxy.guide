/**
 * Regression tests for LAC-5648: an outage must not be answered as a miss,
 * and must not be paid for.
 *
 * `searchGuide` flattened every failure into `{ success: false, error }`, so a
 * blocked term and an unreachable database arrived at the slug page in the
 * same shape and both became a 404. Worse, a failed lookup fell *through* to
 * generation, so each request for one of the ~309 existing entries spent an
 * OpenAI call to rewrite a row it could not then write.
 *
 * The two assertions that matter: the lookup failing stops the paid call, and
 * the caller can tell `unavailable` from `not_found`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findExistingEntry: vi.fn(),
  createEntry: vi.fn(),
  create: vi.fn(),
  allowGuideCreation: vi.fn(),
}));

vi.mock("@/server/services/guide-service", () => ({
  guideService: {
    findExistingEntry: mocks.findExistingEntry,
    createEntry: mocks.createEntry,
  },
}));

vi.mock("@/server/services/guide-generation-limit", () => ({
  allowGuideCreation: mocks.allowGuideCreation,
}));

vi.mock("@/lib/open-ai", () => ({
  openai: { chat: { completions: { create: mocks.create } } },
}));

const generated = {
  content: "Mostly harmless.",
  travelAdvice: "Bring a towel.",
  whereToFind: "Sector ZZ9 Plural Z Alpha.",
  whatToAvoid: "Vogon poetry.",
  funFact: "It is in fact mostly harmless.",
  advertisement: "Sirius Cybernetics Corporation.",
  reliability: 42,
  dangerLevel: 7,
};

const completion = {
  choices: [{ message: { function_call: { arguments: JSON.stringify(generated) } } }],
};

const entry = { id: 1, searchTerm: "towel", ...generated };

const { searchGuide } = await import("@/server/actions/guide-search");

describe("searchGuide", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.allowGuideCreation.mockResolvedValue(true);
    mocks.create.mockResolvedValue(completion);
    mocks.createEntry.mockResolvedValue(entry);
  });

  describe("when the lookup cannot be read", () => {
    beforeEach(() => {
      mocks.findExistingEntry.mockResolvedValue({ status: "unavailable" });
    });

    it("reports unavailable rather than a miss", async () => {
      const result = await searchGuide("towel", true);
      expect(result.success).toBe(false);
      expect(result.status).toBe("unavailable");
    });

    it("does not spend an OpenAI call", async () => {
      await searchGuide("towel", true);
      expect(mocks.create).not.toHaveBeenCalled();
    });

    it("does not attempt a write, or even ask the limiter", async () => {
      await searchGuide("towel", true);
      expect(mocks.createEntry).not.toHaveBeenCalled();
      expect(mocks.allowGuideCreation).not.toHaveBeenCalled();
    });
  });

  it("returns a stored entry as ok", async () => {
    mocks.findExistingEntry.mockResolvedValue({ status: "ok", data: entry });
    const result = await searchGuide("towel", true);
    expect(result).toMatchObject({ success: true, status: "ok" });
    expect(result.success && result.data.searchTerm).toBe("towel");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("generates and writes on a genuine miss", async () => {
    mocks.findExistingEntry.mockResolvedValue({ status: "ok", data: null });
    const result = await searchGuide("towel", true);
    expect(result).toMatchObject({ success: true, status: "ok" });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.createEntry).toHaveBeenCalledTimes(1);
  });

  it("reports a refused term as not found, without generating", async () => {
    mocks.findExistingEntry.mockResolvedValue({ status: "ok", data: null });
    const result = await searchGuide("wp-config.php");
    expect(result).toMatchObject({ success: false, status: "not_found" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reports an empty term as not found", async () => {
    const result = await searchGuide("!!!");
    expect(result).toMatchObject({ success: false, status: "not_found" });
    expect(mocks.findExistingEntry).not.toHaveBeenCalled();
  });

  // The caps are an hour and ten minutes wide, so a term they refuse today
  // may well have an entry on the retry. That is a 503, not a 404.
  it("reports a limiter refusal as unavailable", async () => {
    mocks.findExistingEntry.mockResolvedValue({ status: "ok", data: null });
    mocks.allowGuideCreation.mockResolvedValue(false);
    const result = await searchGuide("towel", true);
    expect(result).toMatchObject({ success: false, status: "unavailable" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reports a failed generation as unavailable", async () => {
    mocks.findExistingEntry.mockResolvedValue({ status: "ok", data: null });
    mocks.create.mockRejectedValue(new Error("OpenAI rate limit"));
    const result = await searchGuide("towel", true);
    expect(result).toMatchObject({ success: false, status: "unavailable" });
    expect(mocks.createEntry).not.toHaveBeenCalled();
  });

  it("reports a failed write as unavailable", async () => {
    mocks.findExistingEntry.mockResolvedValue({ status: "ok", data: null });
    mocks.createEntry.mockRejectedValue(new Error("no connection"));
    const result = await searchGuide("towel", true);
    expect(result).toMatchObject({ success: false, status: "unavailable" });
  });
});

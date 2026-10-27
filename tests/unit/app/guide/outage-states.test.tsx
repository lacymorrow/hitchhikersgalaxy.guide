/**
 * Regression tests for LAC-5520: no guide surface may tell a visitor the guide
 * is empty when the database is simply unreachable.
 *
 * Each of the three surfaces renders a list of entries and had empty-state
 * copy written for the only case it knew about. Once LAC-5405 made the reads
 * resolve to `[]` on failure, an outage landed in that branch and `/popular`
 * served "No entries yet. Start exploring to create some!" to visitors while
 * thousands of entries sat behind an exhausted Neon compute quota -- and
 * invited the one action, a search, that also could not work.
 *
 * The assertions that matter are the negative ones: during an outage the
 * empty-state copy and any invitation to search must not render.
 */

import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPopularEntries: vi.fn(),
  getRecentEntries: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@/server/services/guide-service", () => ({
  guideService: {
    getPopularEntries: mocks.getPopularEntries,
    getRecentEntries: mocks.getRecentEntries,
  },
}));

vi.mock("@/server/db", () => ({
  db: { select: mocks.select },
}));

vi.mock("@/components/primitives/link-with-transition", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/ui/marquee", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const entry = (searchTerm: string) => ({
  id: searchTerm,
  searchTerm,
  content: `All about ${searchTerm}.`,
  popularity: 7,
  reliability: 50,
  dangerLevel: 10,
  category: null,
  createdAt: new Date("2026-10-01"),
  updatedAt: new Date("2026-10-01"),
});

/** `/browse` queries the database directly rather than through the service. */
const browseReturning = (rows: Array<{ searchTerm: string; updatedAt: Date }> | Error) => {
  mocks.select.mockReturnValue({
    from: () => (rows instanceof Error ? Promise.reject(rows) : Promise.resolve(rows)),
  });
};

const outage = () => {
  const error = new Error("Your account or project has exceeded the quota.");
  (error as Error & { code?: string }).code = "53000";
  return error;
};

const EMPTY_COPY = "The Guide is still being written";
const OUTAGE_COPY = "The Guide can't reach its records right now";

/** Copy that tells a visitor to go searching. Dead advice during an outage. */
const INVITATIONS = ["Start exploring", "Start searching", "Search for anything", "Try searching"];

/** Static markup escapes the apostrophes in "Don't panic." and "can't", so
 *  decode before matching and the assertions can quote the copy as written. */
const render = async (surface: () => Promise<React.ReactElement> | React.ReactElement) =>
  renderToStaticMarkup(await surface())
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");

const surfaces = [
  {
    name: "/popular",
    load: async () => (await import("@/app/(app)/(guide)/popular/page")).default,
    ok: (rows: ReturnType<typeof entry>[]) =>
      mocks.getPopularEntries.mockResolvedValue({ status: "ok", data: rows }),
    down: () => mocks.getPopularEntries.mockResolvedValue({ status: "unavailable" }),
  },
  {
    name: "home recent-entries marquee",
    load: async () =>
      (await import("@/app/(app)/(guide)/_components/recent-entries")).RecentEntries,
    ok: (rows: ReturnType<typeof entry>[]) =>
      mocks.getRecentEntries.mockResolvedValue({ status: "ok", data: rows }),
    down: () => mocks.getRecentEntries.mockResolvedValue({ status: "unavailable" }),
  },
  {
    name: "/browse",
    load: async () => (await import("@/app/(app)/(guide)/browse/page")).default,
    ok: (rows: ReturnType<typeof entry>[]) =>
      browseReturning(rows.map((r) => ({ searchTerm: r.searchTerm, updatedAt: r.updatedAt }))),
    down: () => browseReturning(outage()),
  },
] as const;

/** Importing a page pulls its whole module graph through the transform, which
 *  costs more than the default per-test timeout. Do it once for the file. */
const components = new Map<string, Awaited<ReturnType<(typeof surfaces)[number]["load"]>>>();

beforeAll(async () => {
  for (const surface of surfaces) {
    components.set(surface.name, await surface.load());
  }
}, 60_000);

const componentFor = (name: string) => {
  const component = components.get(name);
  if (!component) throw new Error(`${name} was not loaded in beforeAll`);
  return component;
};

describe.each(surfaces)("$name", (surface) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const html = () => render(componentFor(surface.name));

  it("shows the outage state, not the empty state, when the database is unreachable", async () => {
    surface.down();
    const markup = await html();

    expect(markup).toContain(OUTAGE_COPY);
    expect(markup).not.toContain(EMPTY_COPY);
    expect(markup).not.toContain("No entries yet");
  });

  it("does not invite a search during an outage", async () => {
    surface.down();
    const markup = await html();

    for (const invitation of INVITATIONS) {
      expect(markup).not.toContain(invitation);
    }
  });

  it("keeps its descriptive copy during an outage", async () => {
    surface.down();
    const markup = await html();

    // The description of what the page is for stays true while the database
    // is down. Hiding it left these prerendered, crawled routes with no body
    // copy at all for the length of the outage.
    const description = {
      "/popular": "most frequently consulted entries",
      "/browse": "Every entry in the Guide, A to Z.",
      "home recent-entries marquee": null,
    }[surface.name];

    if (description) expect(markup).toContain(description);
  });

  it("does not claim a count of zero during an outage", async () => {
    surface.down();
    const markup = await html();

    expect(markup).not.toMatch(/\b0 of them\b/);
  });

  it("does not repeat the home page's DON'T PANIC hero line", async () => {
    surface.down();
    const markup = await html();

    // The hero already reads DON'T PANIC in display type right above the
    // marquee, so only the full-page surfaces carry the heading.
    const headline = "Don't panic.";
    if (surface.name === "home recent-entries marquee") {
      expect(markup).not.toContain(headline);
    } else {
      expect(markup).toContain(headline);
    }
  });

  it("shows the empty state when the table really is empty", async () => {
    surface.ok([]);
    const markup = await html();

    expect(markup).toContain(EMPTY_COPY);
    expect(markup).not.toContain(OUTAGE_COPY);
  });

  it("shows the entries when there are entries", async () => {
    surface.ok([entry("towel"), entry("vogon-poetry")]);
    const markup = await html();

    expect(markup).toContain("towel");
    expect(markup).not.toContain(EMPTY_COPY);
    expect(markup).not.toContain(OUTAGE_COPY);
  });
});

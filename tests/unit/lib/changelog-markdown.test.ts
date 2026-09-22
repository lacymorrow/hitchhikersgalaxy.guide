import { describe, expect, it } from "vitest";
import { parseChangelogMarkdown } from "@/lib/changelog-markdown";
import { describeEntrySize } from "@/lib/changelog-types";

const SAMPLE = `# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- Uninstall checks that the rc file it edited still parses.

## [1.2.0] - 2026-09-22

Two sentences of release summary that are not a bullet.

### Added

- You can now quit by voice.
- The bar follows your cursor across displays.
  - A nested note that is part of the entry above.

### Fixed

- Transcripts no longer mis-hear the product name.

## [1.1.0] - 2026-08-01

### Changed

- The license is FSL-1.1-MIT everywhere.

## [1.0.5] - 2026-07-04 [YANKED]

### Security

- Rotate the updater signing key.

[Unreleased]: https://github.com/lacymorrow/example/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/lacymorrow/example/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/lacymorrow/example/compare/v1.0.5...v1.1.0
[1.0.5]: https://github.com/lacymorrow/example/releases/tag/v1.0.5
`;

describe("parseChangelogMarkdown", () => {
	it("returns one entry per release heading", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		expect(entries.map((e) => e.badge)).toEqual([
			"Unreleased",
			"1.2.0",
			"1.1.0",
			"1.0.5 (yanked)",
		]);
	});

	it("keeps file order so an undated Unreleased section stays on top", () => {
		const [first] = parseChangelogMarkdown(SAMPLE);
		expect(first?.title).toBe("Unreleased");
		expect(first?.publishedAt).toBe("");
	});

	it("reads the ISO date out of the heading", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		expect(entries[1]?.publishedAt).toBe("2026-09-22");
		expect(entries[2]?.publishedAt).toBe("2026-08-01");
	});

	it("drops the preamble and the trailing link definitions", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		const all = entries.map((e) => e.content).join("\n");
		expect(all).not.toContain("All notable changes");
		expect(all).not.toContain("https://github.com/lacymorrow/example/compare");
	});

	it("keeps the release summary paragraph in the body", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		expect(entries[1]?.content).toContain("Two sentences of release summary");
	});

	it("counts only top level bullets, not nested ones", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		// Two Added bullets plus one Fixed bullet. The nested note is not its own change.
		expect(entries[1]?.changeCount).toBe(3);
	});

	it("summarises categories in a readable order", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		expect(entries[1]?.description).toBe("2 new features, 1 bug fix");
		expect(entries[2]?.description).toBe("1 change");
	});

	it("collects the category headings", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		expect(entries[1]?.categories).toEqual(["Added", "Fixed"]);
	});

	it("flags a yanked release in the badge and description", () => {
		const yanked = parseChangelogMarkdown(SAMPLE).at(-1);
		expect(yanked?.badge).toBe("1.0.5 (yanked)");
		expect(yanked?.description).toContain("Withdrawn release");
	});

	it("builds URL safe slugs", () => {
		const entries = parseChangelogMarkdown(SAMPLE);
		expect(entries.map((e) => e.slug)).toEqual(["unreleased", "1.2.0", "1.1.0", "1.0.5"]);
	});

	it("reports no commit count, because a changelog file knows nothing about commits", () => {
		for (const entry of parseChangelogMarkdown(SAMPLE)) {
			expect(entry.commitCount).toBe(0);
		}
	});

	it("handles versions that are not strict semver", () => {
		const entries = parseChangelogMarkdown("## [0.4.1.2] - 2025-06-29\n\n### Added\n\n- A thing.\n");
		expect(entries[0]?.badge).toBe("0.4.1.2");
		expect(entries[0]?.publishedAt).toBe("2025-06-29");
	});

	it("handles headings without brackets", () => {
		const entries = parseChangelogMarkdown("## 2.0.0 - 2026-01-01\n\n### Added\n\n- A thing.\n");
		expect(entries[0]?.badge).toBe("2.0.0");
		expect(entries[0]?.publishedAt).toBe("2026-01-01");
	});

	it("returns nothing for an empty or heading-free file", () => {
		expect(parseChangelogMarkdown("")).toEqual([]);
		expect(parseChangelogMarkdown("# Changelog\n\nNothing released yet.\n")).toEqual([]);
	});
});

describe("describeEntrySize", () => {
	const base = {
		title: "Release 1.0.0",
		slug: "1.0.0",
		content: "",
		description: "",
		publishedAt: "2026-01-01",
		categories: [],
	};

	it("counts commits for git-derived entries", () => {
		expect(describeEntrySize({ ...base, commitCount: 12 })).toBe("12 commits");
		expect(describeEntrySize({ ...base, commitCount: 1 })).toBe("1 commit");
	});

	it("counts changes for changelog-derived entries", () => {
		expect(describeEntrySize({ ...base, commitCount: 0, changeCount: 4 })).toBe("4 changes");
		expect(describeEntrySize({ ...base, commitCount: 0, changeCount: 1 })).toBe("1 change");
	});

	it("says nothing when there is nothing honest to show", () => {
		expect(describeEntrySize({ ...base, commitCount: 0 })).toBe("");
		expect(describeEntrySize({ ...base, commitCount: 0, changeCount: 0 })).toBe("");
	});
});

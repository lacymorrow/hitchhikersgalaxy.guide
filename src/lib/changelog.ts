import { unstable_cache } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ChangelogEntry {
	title: string;
	slug: string;
	content: string;
	description: string;
	publishedAt: string;
	badge?: string;
	categories: string[];
	commitCount: number;
}

interface GitHubCommit {
	sha: string;
	commit: {
		message: string;
		author: { date: string; name: string };
	};
}

interface GitHubTag {
	name: string;
	commit: { sha: string };
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const REPO_OWNER = process.env.GITHUB_REPO_OWNER ?? "lacymorrow";
const REPO_NAME = process.env.GITHUB_REPO_NAME ?? "shipkit";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const COMMITS_PER_PAGE = 100;
const MAX_PAGES = 5; // 500 commits max

// ---------------------------------------------------------------------------
// GitHub fetcher (works unauthenticated for public repos, uses token if set)
// ---------------------------------------------------------------------------
async function ghFetch<T>(endpoint: string): Promise<T> {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
	};
	const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_ACCESS_TOKEN;
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(`${GITHUB_API}${endpoint}`, { headers });
	if (!res.ok) {
		const errorBody = await res.text().catch(() => "");
		throw new Error(`GitHub API ${res.status}: ${endpoint} - ${errorBody}`);
	}
	return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Fetch all commits (paginated)
// ---------------------------------------------------------------------------
async function fetchCommits(): Promise<GitHubCommit[]> {
	const all: GitHubCommit[] = [];
	for (let page = 1; page <= MAX_PAGES; page++) {
		const batch = await ghFetch<GitHubCommit[]>(
			`/commits?per_page=${COMMITS_PER_PAGE}&page=${page}`
		);
		all.push(...batch);
		if (batch.length < COMMITS_PER_PAGE) break;
	}
	return all;
}

// ---------------------------------------------------------------------------
// Fetch tags and build sha->tag map
// ---------------------------------------------------------------------------
async function fetchTagMap(): Promise<Map<string, string>> {
	const tags = await ghFetch<GitHubTag[]>("/tags?per_page=100");
	const map = new Map<string, string>();
	for (const tag of tags) {
		map.set(tag.commit.sha, tag.name);
	}
	return map;
}

// ---------------------------------------------------------------------------
// Commit message parsing
// ---------------------------------------------------------------------------
const NOISE = [
	/^auto commit$/i,
	/^merge /i,
	/^Merge pull request/,
	/^Merge branch/,
	/^initial commit$/i,
	/^wip$/i,
	/^\.$/,
];

function isNoise(msg: string): boolean {
	return NOISE.some((re) => re.test(msg));
}

interface ParsedCommit {
	type: string;
	scope: string | null;
	subject: string;
	breaking: boolean;
}

function parseConventional(message: string): ParsedCommit | null {
	const match = message.match(
		/^(\w+)(?:\(([^)]+)\))?(!?):\s*(.+)/
	);
	if (!match) return null;
	return {
		type: match[1]!.toLowerCase(),
		scope: match[2] ?? null,
		subject: match[4]!,
		breaking: match[3] === "!",
	};
}

const TYPE_LABELS: Record<string, string> = {
	feat: "New Features",
	fix: "Bug Fixes",
	perf: "Performance",
	refactor: "Improvements",
	docs: "Documentation",
	style: "Styling",
	chore: "Maintenance",
	ci: "CI/CD",
	test: "Testing",
	build: "Build",
};

// ---------------------------------------------------------------------------
// Grouping: by tag or by week
// ---------------------------------------------------------------------------

interface CommitGroup {
	label: string;
	slug: string;
	date: string; // ISO date of the most recent commit
	commits: GitHubCommit[];
	isRelease: boolean;
}

function groupCommits(
	commits: GitHubCommit[],
	tagMap: Map<string, string>
): CommitGroup[] {
	const groups: CommitGroup[] = [];
	let currentGroup: GitHubCommit[] = [];
	let currentTag: string | null = null;

	// Walk commits newest-first, split on tags
	for (const commit of commits) {
		const tag = tagMap.get(commit.sha);
		if (tag && currentGroup.length > 0) {
			// Close previous group
			const newestDate = currentGroup[0]!.commit.author.date;
			const groupLabel = currentTag ?? weekLabel(newestDate);
			const groupSlug = currentTag
				? currentTag.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase()
				: weekSlug(newestDate);

			groups.push({
				label: groupLabel,
				slug: groupSlug,
				date: newestDate,
				commits: currentGroup,
				isRelease: !!currentTag,
			});
			currentGroup = [];
		}
		if (tag) currentTag = tag;
		currentGroup.push(commit);
	}

	// Final group
	if (currentGroup.length > 0) {
		const newestDate = currentGroup[0]!.commit.author.date;
		const groupLabel = currentTag ?? weekLabel(newestDate);
		const groupSlug = currentTag
			? currentTag.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase()
			: weekSlug(newestDate);

		groups.push({
			label: groupLabel,
			slug: groupSlug,
			date: newestDate,
			commits: currentGroup,
			isRelease: !!currentTag,
		});
	}

	// If no tags at all, group by week
	if (tagMap.size === 0) {
		return groupByWeek(commits);
	}

	// For the unreleased group (first, before any tag), split by week if large
	if (groups.length > 0 && !groups[0]!.isRelease && groups[0]!.commits.length > 15) {
		const unreleased = groups.shift()!;
		const weekGroups = groupByWeek(unreleased.commits);
		groups.unshift(...weekGroups);
	}

	return groups;
}

function groupByWeek(commits: GitHubCommit[]): CommitGroup[] {
	const weeks = new Map<string, GitHubCommit[]>();
	for (const c of commits) {
		const key = weekSlug(c.commit.author.date);
		if (!weeks.has(key)) weeks.set(key, []);
		weeks.get(key)!.push(c);
	}

	return Array.from(weeks.entries()).map(([slug, wCommits]) => ({
		label: weekLabel(wCommits[0]!.commit.author.date),
		slug,
		date: wCommits[0]!.commit.author.date,
		commits: wCommits,
		isRelease: false,
	}));
}

function weekSlug(isoDate: string): string {
	const d = new Date(isoDate);
	const monday = new Date(d);
	monday.setDate(d.getDate() - d.getDay() + 1);
	return `week-${monday.toISOString().slice(0, 10)}`;
}

function weekLabel(isoDate: string): string {
	const d = new Date(isoDate);
	const monday = new Date(d);
	monday.setDate(d.getDate() - d.getDay() + 1);
	return `Week of ${monday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
}

// ---------------------------------------------------------------------------
// Render a group into a changelog entry
// ---------------------------------------------------------------------------
function renderEntry(group: CommitGroup): ChangelogEntry {
	const meaningful = group.commits.filter(
		(c) => !isNoise(c.commit.message.split("\n")[0]!)
	);

	// Bucket by conventional commit type
	const buckets = new Map<string, string[]>();
	const uncategorized: string[] = [];

	for (const c of meaningful) {
		const firstLine = c.commit.message.split("\n")[0]!;
		const parsed = parseConventional(firstLine);
		if (parsed) {
			const label = TYPE_LABELS[parsed.type] ?? "Other";
			if (!buckets.has(label)) buckets.set(label, []);
			buckets.get(label)!.push(parsed.subject);
		} else {
			uncategorized.push(firstLine);
		}
	}

	// Build markdown
	const sections: string[] = [];
	const sectionOrder = Object.values(TYPE_LABELS);
	for (const label of sectionOrder) {
		const items = buckets.get(label);
		if (!items?.length) continue;
		sections.push(`## ${label}\n\n${items.map((s) => `- ${s}`).join("\n")}`);
	}
	if (uncategorized.length) {
		sections.push(
			`## Changes\n\n${uncategorized.map((s) => `- ${s}`).join("\n")}`
		);
	}

	const content = sections.join("\n\n") || "Maintenance and internal improvements.";

	// Count features and fixes for description
	const featureCount = buckets.get("New Features")?.length ?? 0;
	const fixCount = buckets.get("Bug Fixes")?.length ?? 0;
	const parts: string[] = [];
	if (featureCount) parts.push(`${featureCount} new feature${featureCount > 1 ? "s" : ""}`);
	if (fixCount) parts.push(`${fixCount} bug fix${fixCount > 1 ? "es" : ""}`);
	if (!parts.length) parts.push(`${meaningful.length} update${meaningful.length !== 1 ? "s" : ""}`);
	const description = parts.join(", ");

	// Badge
	const badge = group.isRelease ? group.label : undefined;

	// Categories from commit types
	const categories = Array.from(buckets.keys());

	return {
		title: group.isRelease ? `Release ${group.label}` : group.label,
		slug: group.slug,
		content,
		description,
		publishedAt: group.date.slice(0, 10),
		badge,
		categories,
		commitCount: group.commits.length,
	};
}

// ---------------------------------------------------------------------------
// Public API (cached for 1 hour via Next.js unstable_cache)
// ---------------------------------------------------------------------------
async function _getChangelogEntries(): Promise<ChangelogEntry[]> {
	try {
		const [commits, tagMap] = await Promise.all([fetchCommits(), fetchTagMap()]);
		const groups = groupCommits(commits, tagMap);
		return groups.map(renderEntry);
	} catch (err) {
		console.error("[changelog] Failed to fetch from GitHub:", err);
		return [];
	}
}

export const getChangelogEntries = unstable_cache(
	_getChangelogEntries,
	["changelog-entries"],
	{ revalidate: 3600 } // 1 hour
);

export async function getChangelogEntry(
	slug: string
): Promise<ChangelogEntry | null> {
	const entries = await getChangelogEntries();
	return entries.find((e) => e.slug === slug) ?? null;
}

import { normalizeSlug } from "@/lib/utils";
import { isSSR } from "@/lib/utils/runtime";
import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

// Since we're in a service, we can assume the database is initialized
// The connection is handled at the app level

// Every read below awaits its query *inside* its own try block. Returning the
// promise instead lets it settle after the try has exited, so the catch never
// runs and the rejection reaches the caller. That is what failed the build:
// `/popular` prerenders getPopularEntries(), and while the Neon compute quota
// was out `next build` died on it, which held the next 16.3.8 og-RCE fix off
// production for a day (LAC-5405). Keep the `await`s. Where a read is wrapped
// in `unstable_cache` below, the `await` that matters is the one on the cached
// call itself: it is inside the try, so a rejection from the query it wraps
// still reaches the catch.

/** Shared by the reads below so the shape stays identical. */
const UNAVAILABLE = { status: "unavailable" } as const;

/** A read that came back and found nothing. A real miss, not an outage. */
const FOUND_NOTHING = { status: "ok", data: null } as const;

// The three reads a crawler can reach -- an entry by its slug, and the recent
// and popular lists -- also cache *across* requests. React `cache` only dedupes
// within one render, so every hit on an entry URL reached Postgres: roughly two
// uncached queries a minute, against a Neon endpoint that only suspends after
// five quiet minutes. The compute therefore never slept, which spends the
// 100 CU-hour free monthly budget in 16.7 days by arithmetic rather than by bad
// luck (LAC-5516). Caching the reads is what lets it idle.
//
// Only answers are cached. A read that failed and a term with no row are both
// left out of the cache on purpose; see `EntryMiss`.

/** On every cached read here, so one `revalidateTag("guide-entries")` purges
 *  the lot. It has to be called from a server action or a route handler --
 *  `createEntry` runs during the slug page's render, where it would throw. */
const GUIDE_ENTRIES_TAG = "guide-entries";

/** An entry's text never changes once written, so it can be held for a day. */
const ENTRY_TTL_S = 60 * 60 * 24;

/** The lists change whenever an entry is created, so they are held for an hour. */
const LIST_TTL_S = 60 * 60;

// `unstable_cache` stores its value as JSON, so timestamps come back from the
// cache as ISO strings while the row type still says `Date` -- and callers do
// call Date methods on them (`formatDistanceToNow(entry.createdAt)`). Revive
// them on the way out so a cache hit and a fresh read are the same shape.
// Done in place: the value is either a row this call just read or this call's
// own copy of the cached JSON, never one shared with another caller.
const DATE_KEYS = new Set(["createdAt", "updatedAt"]);

function reviveDates<T>(value: T): T {
	if (Array.isArray(value)) return value.map(reviveDates) as T;
	if (value === null || typeof value !== "object") return value;
	for (const [key, nested] of Object.entries(value)) {
		(value as Record<string, unknown>)[key] =
			DATE_KEYS.has(key) && typeof nested === "string" ? new Date(nested) : reviveDates(nested);
	}
	return value;
}

/**
 * Thrown from inside a cached lookup when the term has no row, so that the
 * miss is never written to the cache: `unstable_cache` only stores what its
 * callback resolves to, and passes a rejection straight through.
 *
 * It has to stay that way. The slug page generates a missing entry *during
 * render*, where `revalidateTag` cannot run, so a cached "no row" would
 * outlive the entry written moments later and 404 it for a day. A cached
 * failed read would be worse still: it would keep serving a false 404 long
 * after the database came back. Caching misses is the one way this file can
 * turn a performance fix into an outage.
 */
class EntryMiss extends Error {
	readonly isEntryMiss = true;
}

/** Structural too, so a duplicated module copy cannot read a miss as a failure. */
const isEntryMiss = (error: unknown): boolean =>
	error instanceof EntryMiss || (error as EntryMiss | null)?.isEntryMiss === true;

// Track if similarity search is available
let hasSimilaritySearch: boolean | null = null;

async function checkSimilaritySearch() {
	if (hasSimilaritySearch !== null) return hasSimilaritySearch;
	if (!db) return false;

	try {
		// Try a simple similarity query
		await db?.execute(sql`SELECT similarity('test', 'test')`);
		hasSimilaritySearch = true;
	} catch (error) {
		console.warn("Similarity search not available, falling back to basic search");
		hasSimilaritySearch = false;
	}
	return hasSimilaritySearch;
}

export const guideService = {
	getSimilarSearches: cache(async (searchTerm: string, limit = 5) => {
		if (!searchTerm?.trim()) return [];
		// Without this guard `db?.query` widens the return type to include undefined,
		// and GuideSearch maps over the result directly.
		if (!db) return [];

		try {
			const normalizedTerm = normalizeSlug(searchTerm);
			if (!normalizedTerm) return [];

			// Create an alternative version of the term (with spaces instead of hyphens)
			const alternativeTerm = normalizedTerm.replace(/-/g, " ");

			// Always use basic search during SSR or if similarity search isn't available
			if (isSSR() || !(await checkSimilaritySearch())) {
				return await db.query.guideEntries.findMany({
					where: or(
						eq(guideEntries.searchTerm, normalizedTerm),
						eq(guideEntries.searchTerm, alternativeTerm),
						ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
						ilike(guideEntries.searchTerm, `%${alternativeTerm}%`),
						ilike(guideEntries.searchVector, `%${normalizedTerm}%`),
						ilike(guideEntries.searchVector, `%${alternativeTerm}%`)
					),
					orderBy: [desc(guideEntries.popularity)],
					limit,
					with: {
						category: true,
					},
				});
			}

			// Use full similarity search at runtime
			return await db.query.guideEntries.findMany({
				where: and(
					or(
						ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
						ilike(guideEntries.searchTerm, `%${alternativeTerm}%`),
						ilike(guideEntries.searchVector, `%${normalizedTerm}%`),
						ilike(guideEntries.searchVector, `%${alternativeTerm}%`)
					),
					or(
						sql`similarity(${guideEntries.searchTerm}, ${normalizedTerm}) > 0.3`,
						sql`similarity(${guideEntries.searchTerm}, ${alternativeTerm}) > 0.3`
					)
				),
				orderBy: [
					// Order by similarity score first, then by popularity
					sql`GREATEST(
						similarity(${guideEntries.searchTerm}, ${normalizedTerm}),
						similarity(${guideEntries.searchTerm}, ${alternativeTerm})
					) DESC`,
					desc(guideEntries.popularity),
				],
				limit,
				with: {
					category: true,
				},
			});
		} catch (error) {
			console.error("[Guide Service] Error in getSimilarSearches:", error);
			return [];
		}
	}),

	// These two feed pages that render an empty state, so they report an outage
	// apart from an empty table instead of flattening both to `[]` (LAC-5520).
	getRecentEntries: cache(async (limit = 10) => {
		if (!db) return UNAVAILABLE;
		// Aliased because the guard above does not narrow an imported binding
		// inside the callback below, and `db?.` there would widen the row type.
		const database = db;
		try {
			const rows = await unstable_cache(
				async () =>
					database.query.guideEntries.findMany({
						orderBy: [desc(guideEntries.createdAt)],
						limit,
						with: {
							category: true,
						},
					}),
				["guide-recent", String(limit)],
				{ revalidate: LIST_TTL_S, tags: [GUIDE_ENTRIES_TAG] },
			)();
			return { status: "ok", data: reviveDates(rows) } as const;
		} catch (error) {
			console.error("[Guide Service] Error in getRecentEntries:", error);
			return UNAVAILABLE;
		}
	}),

	getPopularEntries: cache(async (limit = 10) => {
		if (!db) return UNAVAILABLE;
		const database = db;
		try {
			const rows = await unstable_cache(
				async () =>
					database.query.guideEntries.findMany({
						orderBy: [desc(guideEntries.popularity)],
						limit,
						with: {
							category: true,
						},
					}),
				["guide-popular", String(limit)],
				{ revalidate: LIST_TTL_S, tags: [GUIDE_ENTRIES_TAG] },
			)();
			return { status: "ok", data: reviveDates(rows) } as const;
		} catch (error) {
			console.error("[Guide Service] Error in getPopularEntries:", error);
			return UNAVAILABLE;
		}
	}),

	/**
	 * The stored entry for a term, when there is one.
	 *
	 * Reports a `GuideRead` because the caller's next move depends on which
	 * kind of nothing this is. `{ status: "ok", data: null }` is a genuine
	 * miss, and a term worth paying OpenAI to write. `unavailable` means the
	 * query never came back, which says nothing at all about whether the
	 * entry exists. Both were `null` until LAC-5648, so an unreachable
	 * database read as a miss on every one of the ~309 entry URLs: each
	 * request spent a generation call to rewrite a row it could not then
	 * write, and 404'd the entry it had simply failed to read.
	 */
	findExistingEntry: async (searchTerm: string | null | undefined, exactMatch = false) => {
		if (!searchTerm?.trim()) {
			return FOUND_NOTHING;
		}

		const normalizedTerm = normalizeSlug(searchTerm);
		if (!normalizedTerm) {
			return FOUND_NOTHING;
		}

		// No connection string is an outage, not a miss -- the same call the
		// two reads above make. Generating against it would burn the OpenAI
		// call and then fail the insert.
		if (!db) {
			return UNAVAILABLE;
		}
		const database = db;

		try {
			// Create an alternative version of the term (with spaces instead of hyphens)
			const alternativeTerm = normalizedTerm.replace(/-/g, " ");

			// If exactMatch is true, only look for exact matches. This is the
			// slug page's lookup, so it is the one crawlers hit and the one
			// worth caching. An answer is held for a day; a miss is not held
			// at all, which is what `EntryMiss` is for.
			if (exactMatch) {
				try {
					const entry = await unstable_cache(
						async () => {
							const found = await database.query.guideEntries.findFirst({
								where: or(
									eq(guideEntries.searchTerm, normalizedTerm),
									eq(guideEntries.searchTerm, alternativeTerm)
								),
								with: {
									category: true,
									sourceCrossReferences: {
										with: {
											targetEntry: true,
										},
									},
								},
							});
							if (!found) throw new EntryMiss();
							return found;
						},
						["guide-entry-exact", normalizedTerm],
						{ revalidate: ENTRY_TTL_S, tags: [GUIDE_ENTRIES_TAG] },
					)();
					return { status: "ok", data: reviveDates(entry) } as const;
				} catch (error) {
					// A miss is an answer: report it, and leave the cache empty
					// so the entry generated next can be read back immediately.
					if (isEntryMiss(error)) return FOUND_NOTHING;
					// Anything else is the query itself failing. Rethrow into
					// the catch below, which reports the outage.
					throw error;
				}
			}

			// Always use basic search during SSR or if similarity search isn't available
			if (isSSR() || !(await checkSimilaritySearch())) {
				const entry = await db.query.guideEntries.findFirst({
					where: or(
						eq(guideEntries.searchTerm, normalizedTerm),
						eq(guideEntries.searchTerm, alternativeTerm),
						ilike(guideEntries.searchTerm, `%${normalizedTerm}%`),
						ilike(guideEntries.searchTerm, `%${alternativeTerm}%`)
					),
					with: {
						category: true,
						sourceCrossReferences: {
							with: {
								targetEntry: true,
							},
						},
					},
				});
				return { status: "ok", data: entry ?? null } as const;
			}

			// Find the most similar existing entry
			const existingEntry = await db.query.guideEntries.findFirst({
				where: or(
					sql`similarity(${guideEntries.searchTerm}, ${normalizedTerm}) > 0.3`,
					sql`similarity(${guideEntries.searchTerm}, ${alternativeTerm}) > 0.3`
				),
				orderBy: [
					// Order by similarity score
					sql`GREATEST(
						similarity(${guideEntries.searchTerm}, ${normalizedTerm}),
						similarity(${guideEntries.searchTerm}, ${alternativeTerm})
					) DESC`,
					desc(guideEntries.popularity),
				],
				with: {
					category: true,
					sourceCrossReferences: {
						with: {
							targetEntry: true,
						},
					},
				},
			});

			if (existingEntry) {
				try {
					// Increment popularity only at runtime
					await db
						.update(guideEntries)
						.set({
							popularity: sql`${guideEntries.popularity} + 1`,
							updatedAt: new Date(),
						})
						.where(eq(guideEntries.id, existingEntry.id));
				} catch (updateError) {
					console.error("[Guide Service] Error updating entry popularity:", updateError);
					// Don't throw the error since this is not critical
				}
			}

			return { status: "ok", data: existingEntry ?? null } as const;
		} catch (error) {
			console.error("[Guide Service] Error in findExistingEntry:", error);
			return UNAVAILABLE;
		}
	},

	createEntry: async (entry: {
		searchTerm: string;
		content: string;
		travelAdvice: string;
		whereToFind: string;
		whatToAvoid: string;
		funFact: string;
		advertisement: string;
		reliability: number;
		dangerLevel: number;
	}) => {
		try {
			// The entry.searchTerm received here IS ALREADY NORMALIZED by searchGuide
			// We trust it and use it directly for storage.
			const termToStore = entry.searchTerm;
			console.log(
				"[Guide Service] createEntry - termToStore (should be pre-normalized):",
				termToStore
			);

			if (!termToStore) {
				console.error(
					"[Guide Service] Attempted to create entry with empty normalized search term."
				);
				throw new Error("Normalized search term cannot be empty for creating an entry.");
			}

			if (!db) {
				throw new Error("Database is not configured; cannot create a guide entry.");
			}

			const [newEntry] = await db
				.insert(guideEntries)
				.values({
					...entry,
					searchTerm: termToStore, // This is the pre-normalized slug
					searchVector: termToStore, // Use the same for simple search vector initially
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			if (!newEntry) {
				throw new Error("Insert returned no guide entry row.");
			}

			return newEntry;
		} catch (error) {
			console.error("[Guide Service] Error in createEntry:", error);
			throw error; // Re-throw to be caught by the action
		}
	},
};

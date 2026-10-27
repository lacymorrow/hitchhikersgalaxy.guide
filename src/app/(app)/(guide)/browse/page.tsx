import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/components/primitives/link-with-transition";
import { isBlockedSearchTerm } from "@/lib/guide-blocklist";
import { isShadowRouteSegment } from "@/lib/guide-routes";
import type { GuideRead } from "@/lib/guide-read";
import { dedupeGuideEntries, guideEntryPath } from "@/lib/seo";
import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";
import { GuideEmpty, GuideUnavailable } from "../_components/guide-states";
import { pageMetadata } from "@/config/metadata";

export const metadata: Metadata = pageMetadata({
	path: "/browse",
	title: "Guide Index",
	description:
		"Every entry in the Hitchhiker's Guide to the Galaxy, A to Z. Browse the complete index of travel advice, fun facts, and things to avoid.",
});

// Entries are generated at runtime as people search, so refresh the index
// hourly rather than freezing it at build time.
export const revalidate = 3600;

// Reports an unreachable database apart from an empty table, so the index does
// not tell visitors "The Guide is still being written" with thousands of
// entries sitting behind an outage (LAC-5520).
async function getAllEntries(): Promise<GuideRead<string[]>> {
	if (!db) return { status: "unavailable" };
	try {
		const entries = await db
			.select({
				searchTerm: guideEntries.searchTerm,
				updatedAt: guideEntries.updatedAt,
			})
			.from(guideEntries);
		// Match the sitemap filter so /browse never links to pages Ahrefs
		// would flag as noindex-in-sitemap (LAC-4156): drop vulnerability-
		// probe entries (dumpsql, mainjs, …) whose slug page renders
		// notFound(), and drop terms that collide with static routes (upload,
		// trpc, …) which the (demo)/dashboard layouts mark noindex.
		const data = dedupeGuideEntries(entries)
			.filter(
				(entry) =>
					!isBlockedSearchTerm(entry.searchTerm) && !isShadowRouteSegment(entry.searchTerm),
			)
			.sort((a, b) => a.searchTerm.localeCompare(b.searchTerm))
			.map((entry) => entry.searchTerm);
		return { status: "ok", data };
	} catch (error) {
		console.error("[Browse] Error fetching guide entries:", error);
		return { status: "unavailable" };
	}
}

/** Group entries under their leading character; digits and symbols under "#". */
function groupByInitial(terms: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>();
	for (const term of terms) {
		const first = term[0]?.toUpperCase() ?? "#";
		const initial = /[A-Z]/.test(first) ? first : "#";
		const group = groups.get(initial) ?? [];
		group.push(term);
		groups.set(initial, group);
	}
	return groups;
}

export default async function BrowsePage() {
	const index = await getAllEntries();
	const allTerms = index.status === "ok" ? index.data : [];
	const groups = groupByInitial(allTerms);

	return (
		<div className="container relative min-h-screen max-w-4xl py-6 lg:py-10">
			<div className="relative rounded-lg border-4 border-[#70c8cd] bg-black p-6 shadow-[0_0_50px_rgba(112,200,205,0.2)]">
				<div className="flex flex-col space-y-8">
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex items-center space-x-2">
							<BookOpen className="h-8 w-8 text-[#70c8cd]" />
							<h1 className="font-mono text-4xl font-bold text-[#70c8cd]">
								Guide Index
							</h1>
						</div>
						{/* Only the count is false during an outage, not the description, so
						    the sentence stays and the number drops. */}
						<p className="max-w-[42rem] font-mono leading-normal text-[#70c8cd]/80">
							{index.status === "ok"
								? `Every entry in the Guide, A to Z. All ${allTerms.length} of them, mostly harmless.`
								: "Every entry in the Guide, A to Z. Mostly harmless."}
						</p>
					</div>

					{index.status === "unavailable" ? (
						<GuideUnavailable className="py-10 text-[#70c8cd]" />
					) : allTerms.length === 0 ? (
						<GuideEmpty className="text-[#70c8cd]" />
					) : (
						<div className="space-y-8">
							{[...groups.entries()].map(([initial, terms]) => (
								<section key={initial}>
									<h2 className="mb-3 border-b border-[#70c8cd]/20 pb-1 font-mono text-2xl font-bold text-[#70c8cd]">
										{initial}
									</h2>
									<ul className="columns-2 gap-8 sm:columns-3">
										{terms.map((term) => (
											<li key={term} className="mb-2 break-inside-avoid">
												<Link
													href={guideEntryPath(term)}
													className="font-mono text-sm capitalize text-[#70c8cd]/80 transition-colors hover:text-[#70c8cd]"
												>
													{term.replace(/-/g, " ")}
												</Link>
											</li>
										))}
									</ul>
								</section>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

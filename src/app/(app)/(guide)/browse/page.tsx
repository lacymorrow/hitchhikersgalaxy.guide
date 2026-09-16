import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/components/primitives/link-with-transition";
import { dedupeGuideEntries, guideEntryPath } from "@/lib/seo";
import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";

export const metadata: Metadata = {
	title: "Guide Index",
	description:
		"Every entry in the Hitchhiker's Guide to the Galaxy, A to Z. Browse the complete index of travel advice, fun facts, and things to avoid.",
	alternates: {
		canonical: "/browse",
	},
};

// Entries are generated at runtime as people search, so refresh the index
// hourly rather than freezing it at build time.
export const revalidate = 3600;

async function getAllEntries() {
	try {
		if (!db) return [];
		const entries = await db
			.select({
				searchTerm: guideEntries.searchTerm,
				updatedAt: guideEntries.updatedAt,
			})
			.from(guideEntries);
		return dedupeGuideEntries(entries).sort((a, b) =>
			a.searchTerm.localeCompare(b.searchTerm)
		);
	} catch (error) {
		console.error("[Browse] Error fetching guide entries:", error);
		return [];
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
	const entries = await getAllEntries();
	const groups = groupByInitial(entries.map((entry) => entry.searchTerm));

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
						<p className="max-w-[42rem] font-mono leading-normal text-[#70c8cd]/80">
							Every entry in the Guide, A to Z. All {entries.length} of them,
							mostly harmless.
						</p>
					</div>

					{entries.length === 0 ? (
						<p className="text-center font-mono text-[#70c8cd]/60">
							The Guide is still being written. Search for anything to add its
							first entry.
						</p>
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

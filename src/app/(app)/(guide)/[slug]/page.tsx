import { ShareButton } from "@/components/buttons/share-button";
import { Link } from "@/components/primitives/link-with-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeSlug } from "@/lib/utils";
import { searchGuide } from "@/server/actions/guide-search";
import type { GuideCrossReference as GuideCrossReferenceSchemaType, GuideEntry as GuideEntrySchemaType } from "@/server/db/schema";
import { guideService } from "@/server/services/guide-service";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Rocket, Shield } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Loading skeleton component
function GuideEntrySkeleton() {
	return (
		<div className="relative rounded-lg border-4 border-[#70c8cd] bg-black p-6 shadow-[0_0_50px_rgba(112,200,205,0.2)]">
			<div className="flex flex-col space-y-8">
				<div className="flex flex-col space-y-4">
					<div className="flex flex-wrap gap-2 items-center justify-between">
						<Skeleton className="h-10 w-64 bg-[#70c8cd]/10" />
						<Skeleton className="h-10 w-32 bg-[#70c8cd]/10" />
					</div>
					<div className="flex flex-wrap gap-4">
						<Skeleton className="h-6 w-32 bg-[#70c8cd]/10" />
						<Skeleton className="h-6 w-32 bg-[#70c8cd]/10" />
						<Skeleton className="h-6 w-32 bg-[#70c8cd]/10" />
					</div>
				</div>

				<div className="space-y-6">
					<Skeleton className="h-40 w-full bg-[#70c8cd]/10" />

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-[#70c8cd]/10" />
						<Skeleton className="h-20 w-full bg-[#70c8cd]/10" />
					</div>

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-[#70c8cd]/10" />
						<Skeleton className="h-20 w-full bg-[#70c8cd]/10" />
					</div>

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-[#70c8cd]/10" />
						<Skeleton className="h-20 w-full bg-[#70c8cd]/10" />
					</div>

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-[#70c8cd]/10" />
						<Skeleton className="h-20 w-full bg-[#70c8cd]/10" />
					</div>
				</div>
			</div>
		</div>
	);
}

// Continue Exploring section skeleton
function ContinueExploringSkeleton() {
	const skeletonItems = [{ id: 'continue-exploring-skeleton-1' }, { id: 'continue-exploring-skeleton-2' }];
	return (
		<div className="mt-8 space-y-4">
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-8 bg-[#70c8cd]/10" />
				<Skeleton className="h-8 w-48 bg-[#70c8cd]/10" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{skeletonItems.map((item) => (
					<Skeleton key={item.id} className="h-32 bg-[#70c8cd]/10" />
				))}
			</div>
		</div>
	);
}

// Async component that loads the entry
async function GuideEntry({ slug }: { slug: string }) {
	// Use searchGuide which finds or generates the entry
	const searchResult = await searchGuide(slug, true); // true for exact match on the slug

	if (!searchResult.success || !searchResult.data) {
		// Log the error if generation/search failed for a reason other than not found
		if (searchResult.error) {
			console.error(
				`[GuideEntry] Failed to find or generate entry for slug "${slug}": ${searchResult.error}`,
			);
		}
		notFound(); // Or, display a more specific error page
	}

	const entry = searchResult.data; // This is the found or newly generated entry

	// Define types for clarity and to help TypeScript
	type GuideEntryWithPotentialRelations = GuideEntrySchemaType & {
		sourceCrossReferences?: Array<GuideCrossReferenceSchemaType & { targetEntry?: GuideEntrySchemaType | null }> | null;
		// category?: CategorySchemaType | null; // If category is also used directly and needs typing
	};

	const typedEntry = entry as GuideEntryWithPotentialRelations;

	// Fetch recent entries
	const rawRecentEntries = await guideService.getRecentEntries(4);
	const recentEntries = rawRecentEntries || []; // Default to empty array if rawRecentEntries is undefined

	// Filter out the current entry from recent entries
	const otherRecentEntries = recentEntries.filter((e) => e.id !== typedEntry.id);

	// Combine cross-references and recent entries, removing duplicates
	const relatedEntries = [
		...(typedEntry.sourceCrossReferences?.map(
			(ref: GuideCrossReferenceSchemaType & { targetEntry?: GuideEntrySchemaType | null }) => ref.targetEntry
		) ?? []),
		...otherRecentEntries
	].filter((e?: GuideEntrySchemaType | null, i?: number, arr?: Array<GuideEntrySchemaType | null | undefined>) =>
		e && // ensure entry exists
		arr?.findIndex(a => a?.id === e.id) === i // remove duplicates
	).slice(0, 2); // limit to 2 entries

	// Format the search term for display (convert hyphens to spaces)
	const displaySearchTerm = typedEntry.searchTerm.replace(/-/g, " ");

	return (
		<div className="space-y-8">
			<div className="relative rounded-lg border-4 border-[#70c8cd] bg-black p-6 shadow-[0_0_50px_rgba(112,200,205,0.2)]">
				<div className="flex flex-col space-y-8">
					<div className="flex flex-col space-y-4">
						<div className="flex flex-wrap gap-2 items-center justify-between">
							<h1 className="font-mono text-3xl font-bold text-[#70c8cd] capitalize sm:text-4xl">
								{displaySearchTerm}
							</h1>
							<ShareButton title={displaySearchTerm} />
						</div>
						<div className="flex flex-wrap gap-4 text-sm text-[#70c8cd]/80">
							<div className="flex items-center gap-1">
								<StarFilledIcon className="h-4 w-4" />
								<span>Reliability: {typedEntry.reliability}%</span>
							</div>
							<div className="flex items-center gap-1">
								<Shield className="h-4 w-4" />
								<span>Danger Level: {typedEntry.dangerLevel}%</span>
							</div>
							<div className="flex items-center gap-1">
								<BookOpen className="h-4 w-4" />
								<span>Views: {typedEntry.popularity}</span>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<section>
							<p className="whitespace-pre-wrap font-mono text-[#70c8cd]/80">
								{typedEntry.content}
							</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
								Travel Advice
							</h2>
							<p className="font-mono text-[#70c8cd]/80">{typedEntry.travelAdvice}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
								Where to Find
							</h2>
							<p className="font-mono text-[#70c8cd]/80">{typedEntry.whereToFind}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
								What to Avoid
							</h2>
							<p className="font-mono text-[#70c8cd]/80">{typedEntry.whatToAvoid}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
								Fun Fact
							</h2>
							<p className="font-mono text-[#70c8cd]/80">{typedEntry.funFact}</p>
						</section>

						{typedEntry.advertisement && (
							<section className="rounded border border-[#70c8cd]/20 bg-[#70c8cd]/5 p-4">
								<h2 className="mb-2 font-mono text-sm font-bold text-[#70c8cd]">
									A word from our sponsors
								</h2>
								<p className="font-mono text-sm italic text-[#70c8cd]/60">
									{typedEntry.advertisement}
								</p>
							</section>
						)}
					</div>
				</div>
			</div>

			{/* Continue Exploring section */}
			<div className="rounded-lg border-2 border-[#70c8cd]/20 bg-black p-6">
				<div className="mb-6 flex items-center gap-2">
					<Rocket className="h-6 w-6 text-[#70c8cd]" />
					<h2 className="font-mono text-2xl font-bold text-[#70c8cd]">
						Continue Exploring
					</h2>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{relatedEntries.map((relatedEntry) => {
						// Format the related entry search term for display
						const relatedDisplayTerm = relatedEntry?.searchTerm.replace(/-/g, " ");

						return (
							<Link
								key={relatedEntry?.id}
								href={`/${encodeURIComponent(relatedDisplayTerm || '')}`}
								className="transition-transform hover:scale-[1.02]"
							>
								<Card className="h-full border-[#70c8cd]/20 bg-black hover:border-[#70c8cd]/40">
									<CardHeader>
										<CardTitle className="line-clamp-1 text-lg capitalize text-[#70c8cd]">
											{relatedDisplayTerm}
										</CardTitle>
										{relatedEntry?.createdAt && (
											<p className="text-sm text-[#70c8cd]/60">
												{formatDistanceToNow(relatedEntry.createdAt, { addSuffix: true })}
											</p>
										)}
									</CardHeader>
									<CardContent>
										<p className="line-clamp-2 text-sm text-[#70c8cd]/80">
											{relatedEntry?.content}
										</p>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default async function GuidePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	// Decode the slug from params
	const resolvedParams = await params; // Resolve the promise if params is a Promise
	let rawSlug = resolvedParams.slug;

	try {
		// Ensure the slug is decoded before normalization
		rawSlug = decodeURIComponent(rawSlug);
	} catch (e) {
		console.error("[GuidePage] Error decoding slug:", rawSlug, e);
		// Handle cases where decoding might fail (e.g., malformed URI)
		// Depending on requirements, you might notFound() or use rawSlug as is
	}

	// Normalize the raw slug using the same logic as the service
	const normalizedSlugForPage = normalizeSlug(rawSlug);
	console.log(`[GuidePage] Decoded raw slug: "${rawSlug}", Normalized slug for page: "${normalizedSlugForPage}"`);

	return (
		<div className="container relative min-h-screen max-w-4xl py-6 lg:py-10">
			<Suspense fallback={
				<div className="space-y-8">
					<GuideEntrySkeleton />
					<ContinueExploringSkeleton />
				</div>
			}>
				<GuideEntry slug={normalizedSlugForPage} />
			</Suspense>
		</div>
	);
}

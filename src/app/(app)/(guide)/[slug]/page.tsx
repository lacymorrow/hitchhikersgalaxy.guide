import { ShareButton } from "@/components/buttons/share-button";
import { Link } from "@/components/primitives/link-with-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { guideService } from "@/server/services/guide-service";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Rocket, Shield } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// Loading skeleton component
function GuideEntrySkeleton() {
	return (
		<div className="relative rounded-lg border-4 border-green-500 bg-black p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
			<div className="flex flex-col space-y-8">
				<div className="flex flex-col space-y-4">
					<div className="flex flex-wrap gap-2 items-center justify-between">
						<Skeleton className="h-10 w-64 bg-green-500/10" />
						<Skeleton className="h-10 w-32 bg-green-500/10" />
					</div>
					<div className="flex flex-wrap gap-4">
						<Skeleton className="h-6 w-32 bg-green-500/10" />
						<Skeleton className="h-6 w-32 bg-green-500/10" />
						<Skeleton className="h-6 w-32 bg-green-500/10" />
					</div>
				</div>

				<div className="space-y-6">
					<Skeleton className="h-40 w-full bg-green-500/10" />

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-green-500/10" />
						<Skeleton className="h-20 w-full bg-green-500/10" />
					</div>

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-green-500/10" />
						<Skeleton className="h-20 w-full bg-green-500/10" />
					</div>

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-green-500/10" />
						<Skeleton className="h-20 w-full bg-green-500/10" />
					</div>

					<div>
						<Skeleton className="mb-4 h-8 w-40 bg-green-500/10" />
						<Skeleton className="h-20 w-full bg-green-500/10" />
					</div>
				</div>
			</div>
		</div>
	);
}

// Continue Exploring section skeleton
function ContinueExploringSkeleton() {
	return (
		<div className="mt-8 space-y-4">
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-8 bg-green-500/10" />
				<Skeleton className="h-8 w-48 bg-green-500/10" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{Array.from({ length: 2 }).map((_, i) => (
					<Skeleton key={i} className="h-32 bg-green-500/10" />
				))}
			</div>
		</div>
	);
}

// Async component that loads the entry
async function GuideEntry({ slug }: { slug: string }) {
	const entry = await guideService.findExistingEntry(slug);
	const recentEntries = await guideService.getRecentEntries(4);

	if (!entry) {
		notFound();
	}

	// Filter out the current entry from recent entries
	const otherRecentEntries = recentEntries.filter(e => e.id !== entry.id);

	// Combine cross-references and recent entries, removing duplicates
	const relatedEntries = [
		...(entry.sourceCrossReferences?.map(ref => ref.targetEntry) ?? []),
		...otherRecentEntries
	].filter((e, i, arr) =>
		e && // ensure entry exists
		arr.findIndex(a => a?.id === e.id) === i // remove duplicates
	).slice(0, 2); // limit to 2 entries

	// Format the search term for display (convert hyphens to spaces)
	const displaySearchTerm = entry.searchTerm.replace(/-/g, " ");

	return (
		<div className="space-y-8">
			<div className="relative rounded-lg border-4 border-green-500 bg-black p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
				<div className="flex flex-col space-y-8">
					<div className="flex flex-col space-y-4">
						<div className="flex flex-wrap gap-2 items-center justify-between">
							<h1 className="font-mono text-3xl font-bold text-green-500 capitalize sm:text-4xl">
								{displaySearchTerm}
							</h1>
							<ShareButton title={displaySearchTerm} />
						</div>
						<div className="flex flex-wrap gap-4 text-sm text-green-400/80">
							<div className="flex items-center gap-1">
								<StarFilledIcon className="h-4 w-4" />
								<span>Reliability: {entry.reliability}%</span>
							</div>
							<div className="flex items-center gap-1">
								<Shield className="h-4 w-4" />
								<span>Danger Level: {entry.dangerLevel}%</span>
							</div>
							<div className="flex items-center gap-1">
								<BookOpen className="h-4 w-4" />
								<span>Views: {entry.popularity}</span>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<section>
							<p className="whitespace-pre-wrap font-mono text-green-400/80">
								{entry.content}
							</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-green-500">
								Travel Advice
							</h2>
							<p className="font-mono text-green-400/80">{entry.travelAdvice}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-green-500">
								Where to Find
							</h2>
							<p className="font-mono text-green-400/80">{entry.whereToFind}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-green-500">
								What to Avoid
							</h2>
							<p className="font-mono text-green-400/80">{entry.whatToAvoid}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-green-500">
								Fun Fact
							</h2>
							<p className="font-mono text-green-400/80">{entry.funFact}</p>
						</section>

						{entry.advertisement && (
							<section className="rounded border border-green-500/20 bg-green-500/5 p-4">
								<h2 className="mb-2 font-mono text-sm font-bold text-green-500">
									A word from our sponsors
								</h2>
								<p className="font-mono text-sm italic text-green-400/60">
									{entry.advertisement}
								</p>
							</section>
						)}
					</div>
				</div>
			</div>

			{/* Continue Exploring section */}
			<div className="rounded-lg border-2 border-green-500/20 bg-black p-6">
				<div className="mb-6 flex items-center gap-2">
					<Rocket className="h-6 w-6 text-green-500" />
					<h2 className="font-mono text-2xl font-bold text-green-500">
						Continue Exploring
					</h2>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{relatedEntries.map((relatedEntry) => {
						// Format the related entry search term for display
						const relatedDisplayTerm = relatedEntry.searchTerm.replace(/-/g, " ");

						return (
							<Link
								key={relatedEntry.id}
								href={`/${encodeURIComponent(relatedEntry.searchTerm)}`}
								className="transition-transform hover:scale-[1.02]"
							>
								<Card className="h-full border-green-500/20 bg-black hover:border-green-500/40">
									<CardHeader>
										<CardTitle className="line-clamp-1 text-lg capitalize text-green-500">
											{relatedDisplayTerm}
										</CardTitle>
										<p className="text-sm text-green-400/60">
											{formatDistanceToNow(relatedEntry.createdAt, { addSuffix: true })}
										</p>
									</CardHeader>
									<CardContent>
										<p className="line-clamp-2 text-sm text-green-400/80">
											{relatedEntry.content}
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
	const { slug } = await params;

	return (
		<div className="container relative min-h-screen max-w-4xl py-6 lg:py-10">
			<Suspense fallback={
				<div className="space-y-8">
					<GuideEntrySkeleton />
					<ContinueExploringSkeleton />
				</div>
			}>
				<GuideEntry slug={slug} />
			</Suspense>
		</div>
	);
}

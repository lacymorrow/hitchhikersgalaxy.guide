import { ShareButton } from "@/components/buttons/share-button";
import { Link } from "@/components/primitives/link-with-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { pageMetadata } from "@/config/metadata";
import { checkRawShape } from "@/lib/guide-gate";
import { GuideUnavailableError, guideReadOr } from "@/lib/guide-read";
import { guideEntryPath, guideEntrySeo } from "@/lib/seo";
import { normalizeSlug } from "@/lib/utils";
import { searchGuide } from "@/server/actions/guide-search";
import type { GuideCrossReference as GuideCrossReferenceSchemaType, GuideEntry as GuideEntrySchemaType } from "@/server/db/schema";
import { guideService } from "@/server/services/guide-service";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Rocket, Shield } from "lucide-react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const resolvedParams = await params;
    let rawSlug = resolvedParams.slug;
    try {
        rawSlug = decodeURIComponent(rawSlug);
    } catch {
        // use raw slug as fallback
    }
    // Canonicalize on the normalized slug: case/whitespace variants of the same
    // entry all render identical content, so each must declare the same
    // canonical URL (GSC: "Duplicate, Google chose different canonical").
    const canonicalSlug = normalizeSlug(rawSlug) || rawSlug;
    const displayName = canonicalSlug.replace(/-/g, " ");
    const capitalizedName = displayName.replace(/\b\w/g, (c) => c.toUpperCase());

    const { title, description } = guideEntrySeo(capitalizedName);

    return pageMetadata({
        path: guideEntryPath(canonicalSlug),
        title,
        description,
        type: "article",
    });
}

// Continue Exploring section skeleton
function ContinueExploringSkeleton() {
    const skeletonItems = [{ id: 'continue-exploring-skeleton-1' }, { id: 'continue-exploring-skeleton-2' }];
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {skeletonItems.map((item) => (
                <Skeleton key={item.id} className="h-32 bg-[#70c8cd]/10" />
            ))}
        </div>
    );
}

// Define types for clarity and to help TypeScript
type GuideEntryWithPotentialRelations = GuideEntrySchemaType & {
    sourceCrossReferences?: Array<GuideCrossReferenceSchemaType & { targetEntry?: GuideEntrySchemaType | null }> | null;
    // category?: CategorySchemaType | null; // If category is also used directly and needs typing
};

/**
 * The related-entry list, and the only part of this route that is allowed to
 * stream. It decorates the page: it decides no status, so a slow or
 * unreachable database here costs a shorter list, never a wrong status code.
 *
 * This is the "slow part beside it" that
 * tests/node/app/no-loading-above-not-found.test.ts points at. The entry
 * itself is not that part, and wrapping it is what caused LAC-5888.
 */
async function ContinueExploring({ entry }: { entry: GuideEntryWithPotentialRelations }) {
    // Related entries only decorate the page, so an outage here means a shorter
    // related list rather than a state of its own.
    const recentEntries = guideReadOr(await guideService.getRecentEntries(4), []);

    // Filter out the current entry from recent entries
    const otherRecentEntries = recentEntries.filter((e) => e.id !== entry.id);

    // Combine cross-references and recent entries, removing duplicates
    const relatedEntries = [
        ...(entry.sourceCrossReferences?.map(
            (ref: GuideCrossReferenceSchemaType & { targetEntry?: GuideEntrySchemaType | null }) => ref.targetEntry
        ) ?? []),
        ...otherRecentEntries
    ].filter((e?: GuideEntrySchemaType | null, i?: number, arr?: Array<GuideEntrySchemaType | null | undefined>) =>
        e && // ensure entry exists
        arr?.findIndex(a => a?.id === e.id) === i // remove duplicates
    ).slice(0, 2); // limit to 2 entries

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {relatedEntries.map((relatedEntry) => {
                // Format the related entry search term for display
                const relatedDisplayTerm = relatedEntry?.searchTerm.replace(/-/g, " ");

                return (
                    <Link
                        key={relatedEntry?.id}
                        // Link the stored term, not the display term: linking
                        // "skibidi-toilet" as /skibidi%20toilet minted a second
                        // URL for the same entry on every page (LAC-3918).
                        href={guideEntryPath(relatedEntry?.searchTerm || '')}
                        className="transition-transform hover:scale-[1.02]"
                    >
                        <Card className="rounded-xl border shadow h-full border-[#70c8cd]/20 bg-black hover:border-[#70c8cd]/40">
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
    );
}

// Renders an entry that is already in hand. Synchronous on purpose: by the
// time this runs the status is settled, so there is nothing left to suspend on.
function GuideEntry({ entry }: { entry: GuideEntryWithPotentialRelations }) {
    // Format the search term for display (convert hyphens to spaces)
    const displaySearchTerm = entry.searchTerm.replace(/-/g, " ");

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
                            <p className="whitespace-pre-wrap font-mono text-[#70c8cd]/80">
                                {entry.content}
                            </p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
                                Travel Advice
                            </h2>
                            <p className="font-mono text-[#70c8cd]/80">{entry.travelAdvice}</p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
                                Where to Find
                            </h2>
                            <p className="font-mono text-[#70c8cd]/80">{entry.whereToFind}</p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
                                What to Avoid
                            </h2>
                            <p className="font-mono text-[#70c8cd]/80">{entry.whatToAvoid}</p>
                        </section>

                        <section>
                            <h2 className="mb-2 font-mono text-xl font-bold text-[#70c8cd]">
                                Fun Fact
                            </h2>
                            <p className="font-mono text-[#70c8cd]/80">{entry.funFact}</p>
                        </section>

                        {entry.advertisement && (
                            <section className="rounded border border-[#70c8cd]/20 bg-[#70c8cd]/5 p-4">
                                <h2 className="mb-2 font-mono text-sm font-bold text-[#70c8cd]">
                                    A word from our sponsors
                                </h2>
                                <p className="font-mono text-sm italic text-[#70c8cd]/60">
                                    {entry.advertisement}
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
                <Suspense fallback={<ContinueExploringSkeleton />}>
                    <ContinueExploring entry={entry} />
                </Suspense>
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

    // File, path, and payload shapes (`settings.py`, `.env`, `%2e%2e`) 404
    // here, before the canonical redirect below strips their dots and turns
    // them into a generatable slug like `settingspy`.
    if (checkRawShape(rawSlug)) {
        notFound();
    }

    // Normalize the raw slug using the same logic as the service
    const normalizedSlugForPage = normalizeSlug(rawSlug);
    if (!normalizedSlugForPage) {
        notFound();
    }

    // Case/whitespace variants (/TRIBBLE, /Tribble) all served 200 with
    // self-referencing canonicals, so Google indexed them as competing
    // duplicates (LAC-3918). Redirect them to the normalized URL instead.
    if (rawSlug !== normalizedSlugForPage) {
        permanentRedirect(guideEntryPath(normalizedSlugForPage));
    }

    // Await the lookup here, in the page body, before returning any JSX. Next
    // commits the status with the first flushed byte, so a lookup that decides
    // the status has to finish before that byte exists. This used to run inside
    // a <Suspense> below, which flushed a 200 shell and then rendered a
    // not-found body into it: HTTP 200, a "Don't Panic" 404 page, two competing
    // robots tags, ~309 indexed entries going noindex (LAC-5888, LAC-4156).
    // Anything slow that does NOT decide the status still streams; see
    // <ContinueExploring>.
    const searchResult = await searchGuide(normalizedSlugForPage, true); // true for exact match on the slug

    if (!searchResult.success) {
        console.error(
            `[GuidePage] No entry for slug "${normalizedSlugForPage}" (${searchResult.status}): ${searchResult.error}`,
        );
        // Two failures, two statuses (LAC-5648). `not_found` is a judgement
        // about the term and a retry changes nothing, so 404 is the truth.
        // `unavailable` is a judgement about the Guide and is no evidence that
        // the entry is missing, so it must throw: Google retries a 5xx and
        // drops a 404, and during the last outage a 404 here would have
        // de-indexed every entry the Guide actually still holds.
        if (searchResult.status === "unavailable") {
            throw new GuideUnavailableError(searchResult.error);
        }
        notFound();
    }

    const entry = searchResult.data as GuideEntryWithPotentialRelations; // This is the found or newly generated entry

    // The lookup also matches hyphen/space alternates of the stored term
    // (e.g. /skibidi%20toilet finds "skibidi-toilet"). Send those to the
    // entry's one canonical URL instead of serving duplicate content.
    if (entry.searchTerm !== normalizedSlugForPage) {
        permanentRedirect(guideEntryPath(entry.searchTerm));
    }

    return (
        <div className="container relative min-h-screen max-w-4xl py-6 lg:py-10">
            <GuideEntry entry={entry} />
        </div>
    );
}

import { ShareButton } from "@/components/buttons/share-button";
import { guideService } from "@/server/services/guide-service";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { BookOpen, Shield } from "lucide-react";
import { notFound } from "next/navigation";

export default async function GuidePage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const entry = await guideService.findExistingEntry(slug);

	if (!entry) {
		notFound();
	}

	return (
		<div className="container relative min-h-screen max-w-4xl py-6 lg:py-10">
			{/* Electronic book frame */}
			<div className="relative rounded-lg border-4 border-blue-500 bg-black p-6 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
				{/* Screen interface */}
				<div className="flex flex-col space-y-8">
					{/* Header */}
					<div className="flex flex-col space-y-4">
						<div className="flex flex-wrap gap-2 items-center justify-between">
							<h1 className="font-mono text-3xl font-bold text-blue-500 capitalize sm:text-4xl">
								{entry.searchTerm}
							</h1>
							<ShareButton title={entry.searchTerm} />
						</div>
						<div className="flex flex-wrap gap-4 text-sm text-blue-400/80">
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

					{/* Main content */}
					<div className="space-y-6">
						<section>
							<p className="whitespace-pre-wrap font-mono text-blue-400/80">
								{entry.content}
							</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-blue-500">
								Travel Advice
							</h2>
							<p className="font-mono text-blue-400/80">{entry.travelAdvice}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-blue-500">
								Where to Find
							</h2>
							<p className="font-mono text-blue-400/80">{entry.whereToFind}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-blue-500">
								What to Avoid
							</h2>
							<p className="font-mono text-blue-400/80">{entry.whatToAvoid}</p>
						</section>

						<section>
							<h2 className="mb-2 font-mono text-xl font-bold text-blue-500">
								Fun Fact
							</h2>
							<p className="font-mono text-blue-400/80">{entry.funFact}</p>
						</section>

						{entry.advertisement && (
							<section className="rounded border border-blue-500/20 bg-blue-500/5 p-4">
								<h2 className="mb-2 font-mono text-sm font-bold text-blue-500">
									A word from our sponsors
								</h2>
								<p className="font-mono text-sm italic text-blue-400/60">
									{entry.advertisement}
								</p>
							</section>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

import { guideService } from "@/server/services/guide-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@/components/primitives/link-with-transition";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { ShareButton } from "@/components/buttons/share-button";

export default async function PopularEntriesPage() {
	const entries = await guideService.getPopularEntries(20); // Get top 20 entries

	return (
		<div className="container relative min-h-screen max-w-6xl py-6 lg:py-10">
			{/* Electronic book frame */}
			<div className="relative rounded-lg border-4 border-green-500 bg-black p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
				{/* Screen interface */}
				<div className="flex flex-col space-y-8">
					{/* Header */}
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex items-center space-x-2">
							<StarFilledIcon className="h-8 w-8 text-green-500" />
							<h1 className="font-mono text-4xl font-bold text-green-500">
								Popular Entries
							</h1>
						</div>
						<p className="max-w-[42rem] font-mono leading-normal text-green-400/80 sm:text-xl sm:leading-8">
							The most frequently consulted entries in the Guide, as determined by
							our sophisticated popularity algorithm (we count how many times
							they're viewed).
						</p>
					</div>

					{/* Popular entries grid */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{entries.map((entry) => (
							<Link
								key={entry.id}
								href={`/${entry.searchTerm}`}
								className="transition-transform hover:scale-[1.02]"
							>
								<Card className="flex h-full flex-col border-green-500/20 bg-black hover:border-green-500/40">
									<CardHeader>
										<CardTitle className="line-clamp-1 text-lg capitalize text-green-500">
											{entry.searchTerm}
										</CardTitle>
										<div className="flex items-center gap-2 text-sm text-green-400/60">
											<StarFilledIcon className="h-4 w-4" />
											<span>{entry.popularity} views</span>
										</div>
									</CardHeader>
									<CardContent className="flex-1">
										<p className="line-clamp-4 text-sm text-green-400/80">
											{entry.content}
										</p>
									</CardContent>
								</Card>
							</Link>
						))}
						{entries.length === 0 && (
							<div className="col-span-full text-center text-muted-foreground">
								No entries yet. Start exploring to create some!
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

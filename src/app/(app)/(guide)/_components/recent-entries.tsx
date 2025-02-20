import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guideService } from "@/server/services/guide-service";
import type { GuideEntry } from "@/server/db/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@/components/primitives/link-with-transition";

export async function RecentEntries() {
	const entries = await guideService.getRecentEntries();

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{entries.map((entry: GuideEntry) => (
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
							<p className="text-sm text-green-400/60">
								{formatDistanceToNow(entry.createdAt, { addSuffix: true })}
							</p>
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
					No entries yet. Start searching to create some!
				</div>
			)}
		</div>
	);
}

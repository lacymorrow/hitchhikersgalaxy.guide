import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { guideService } from "@/server/services/guide-service";
import type { GuideEntry } from "@/server/db/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@/components/primitives/link-with-transition";
import Marquee from "@/components/ui/marquee";

export async function RecentEntries() {
	const entries = await guideService.getRecentEntries(20); // Get top 20 entries

	if (entries.length === 0) {
		return (
			<div className="text-center text-muted-foreground">
				No entries yet. Start searching to create some!
			</div>
		);
	}

	return (
		<Marquee className="py-4" pauseOnHover>
			{entries.map((entry: GuideEntry) => (
				<Link
					key={entry.id}
					href={`/${entry.searchTerm}`}
					className="mx-4 transition-transform hover:scale-[1.02]"
				>
					<Card className="w-[300px] border-green-500/20 bg-black hover:border-green-500/40">
						<CardHeader>
							<CardTitle className="line-clamp-1 text-lg capitalize text-green-500">
								{entry.searchTerm}
							</CardTitle>
							<p className="text-sm text-green-400/60">
								{formatDistanceToNow(entry.createdAt, { addSuffix: true })}
							</p>
						</CardHeader>
						<CardContent>
							<p className="line-clamp-2 text-sm text-green-400/80">
								{entry.content}
							</p>
						</CardContent>
					</Card>
				</Link>
			))}
		</Marquee>
	);
}

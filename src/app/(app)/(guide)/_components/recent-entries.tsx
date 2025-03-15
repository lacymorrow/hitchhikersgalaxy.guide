import Marquee from "@/components/ui/marquee";
import type { GuideEntry } from "@/server/db/schema";
import { guideService } from "@/server/services/guide-service";
import { DatabaseIcon } from "lucide-react";
import { EntryCard } from "./entry-card";

export async function RecentEntries() {
	try {
		const entries = await guideService.getRecentEntries(20) || []; // Get top 20 entries, default to empty array

		if (entries.length === 0) {
			return (
				<div className="flex items-center justify-center h-[200px] text-center text-muted-foreground">
					No entries yet. Start searching to create some!
				</div>
			);
		}

		return (
			<div className="[mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent_100%)]">
				<Marquee className="py-4 h-[200px]" pauseOnHover>
					{entries.map((entry: GuideEntry, index: number) => (
						<EntryCard key={entry.id} entry={entry} index={index} />
					))}
				</Marquee>
			</div>
		);
	} catch (error) {
		console.error("[Recent Entries] Error fetching entries:", error);
		return (
			<div className="flex flex-col items-center justify-center gap-3 py-6 h-[200px] text-center text-green-400/60">
				<DatabaseIcon className="h-8 w-8 text-green-500/40" />
				<p>The Guide's database is currently experiencing technical difficulties.</p>
				<p className="text-sm">Don't panic! Try searching for something new instead.</p>
			</div>
		);
	}
}

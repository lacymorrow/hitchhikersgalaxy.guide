import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentEntries } from "@/server/actions/guide-search";
import { formatDistanceToNow } from "date-fns";

export async function RecentEntries() {
	const entries = await getRecentEntries();

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{entries.map((entry) => (
				<Card key={entry.id} className="flex flex-col">
					<CardHeader>
						<CardTitle className="line-clamp-1 text-lg capitalize">
							{entry.searchTerm}
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							{formatDistanceToNow(entry.createdAt, { addSuffix: true })}
						</p>
					</CardHeader>
					<CardContent className="flex-1">
						<p className="line-clamp-4 text-sm text-muted-foreground">
							{entry.content}
						</p>
					</CardContent>
				</Card>
			))}
			{entries.length === 0 && (
				<div className="col-span-full text-center text-muted-foreground">
					No entries yet. Start searching to create some!
				</div>
			)}
		</div>
	);
}

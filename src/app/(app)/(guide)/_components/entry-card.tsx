"use client";

import { FadeIn } from "@/components/animations/fade-in";
import { Link } from "@/components/primitives/link-with-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GuideEntry } from "@/server/db/schema";
import { format, formatDistanceToNow } from "date-fns";

interface EntryCardProps {
	entry: GuideEntry;
	index: number;
}

export const EntryCard = ({ entry, index }: EntryCardProps) => {
	// Calculate a staggered delay based on the index
	const delay = 100 + index * 50; // 100ms base delay + 50ms per item

	return (
		<FadeIn delay={delay} duration={400}>
			<Link
				href={`/${encodeURIComponent(entry.searchTerm)}`}
				className="mx-4 transition-transform hover:scale-[1.02]"
			>
				<Card className="w-[300px] h-[150px] border border-[#70c8cd]/60 bg-gray-900/70 hover:border-[#70c8cd]/90 hover:bg-gray-900/90 transition-colors duration-200">
					<CardHeader className="pb-2">
						<CardTitle className="line-clamp-1 text-lg capitalize text-[#70c8cd]">
							{entry.searchTerm}
						</CardTitle>
						<p
							className="text-sm text-[#70c8cd]/60 cursor-help"
							title={format(entry.createdAt, "PPpp")}
						>
							{formatDistanceToNow(entry.createdAt, { addSuffix: true })}
						</p>
					</CardHeader>
					<CardContent>
						<p className="line-clamp-2 text-sm text-[#70c8cd]/80">
							{entry.content}
						</p>
					</CardContent>
				</Card>
			</Link>
		</FadeIn>
	);
};

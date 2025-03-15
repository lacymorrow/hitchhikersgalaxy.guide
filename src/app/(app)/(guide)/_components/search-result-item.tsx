"use client";

import { FadeIn } from "@/components/animations/fade-in";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { GuideEntry } from "@/server/db/schema";
import { formatDistanceToNow } from "date-fns";

interface SearchResultItemProps {
    result: GuideEntry;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
}

export const SearchResultItem = ({
    result,
    index,
    isSelected,
    onSelect,
}: SearchResultItemProps) => {
    // Calculate a staggered delay based on the index
    const delay = 50 + index * 30; // 50ms base delay + 30ms per item

    // Format the search term for display (convert hyphens to spaces)
    const displaySearchTerm = result.searchTerm.replace(/-/g, " ");

    return (
        <FadeIn delay={delay} duration={300}>
            <CommandItem
                id={`search-item-${index}`}
                key={result.id}
                value={result.searchTerm}
                onSelect={onSelect}
                className={cn(
                    "flex cursor-pointer flex-col items-start gap-1 rounded border border-transparent p-3 text-green-400 aria-selected:border-green-500/40 aria-selected:bg-green-500/10",
                    isSelected && "border-green-500/40 bg-green-500/10"
                )}
            >
                <div className="font-mono text-base capitalize text-green-500">
                    {displaySearchTerm}
                </div>
                <div className="line-clamp-1 text-xs text-green-400/60">
                    {formatDistanceToNow(result.createdAt, { addSuffix: true })}
                </div>
            </CommandItem>
        </FadeIn>
    );
};

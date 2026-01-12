import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function normalizeSlug(slug: string): string {
	if (!slug?.trim()) {
		return "";
	}
	let normalized = slug.toLowerCase().trim();
	// Remove most special characters, but keep spaces and hyphens for now
	normalized = normalized.replace(/[^\w\s-]/g, "");
	// Collapse multiple spaces into one
	normalized = normalized.replace(/\s+/g, " ");
	// Convert to singular form - REMOVED as per user request
	// normalized = pluralize.singular(normalized);
	// Replace spaces with hyphens - REMOVED as per user request. Spaces will be preserved.
	// normalized = normalized.replace(/\s/g, "-");
	// Remove any leading/trailing hyphens that might have formed
	normalized = normalized.replace(/^-+|-+$/g, "");
	// Collapse multiple hyphens into one
	normalized = normalized.replace(/-+/g, "-");
	// Since spaces are preserved, we might want to trim again in case leading/trailing hyphens were removed next to spaces.
	// However, the current .replace(/^-+|-+$/g, "") only targets hyphens at the very start/end of the string.
	// If the original string had leading/trailing spaces, the initial .trim() handles it.
	// If the original string was e.g. " - word - ", it becomes "- word -" after special char removal,
	// then the hyphen removal makes it " word ". Another trim would be good.
	normalized = normalized.trim(); // Added trim for safety after other operations
	return normalized;
}

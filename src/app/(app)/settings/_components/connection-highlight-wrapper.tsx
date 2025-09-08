"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ConnectionHighlightWrapperProps {
	children: React.ReactNode;
	connectionType: "github" | "vercel" | "cell";
}

export const ConnectionHighlightWrapper = ({
	children,
	connectionType,
}: ConnectionHighlightWrapperProps) => {
	const searchParams = useSearchParams();
	const router = useRouter();
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const success = searchParams?.get("success");
		const highlight = searchParams?.get("highlight");

		// Check if this section should be highlighted
		const shouldHighlight =
			success === `${connectionType}_connected` || highlight === connectionType;

		if (shouldHighlight && wrapperRef.current) {
			// Scroll into view
			wrapperRef.current.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});

			// Add highlight animation
			wrapperRef.current.classList.add("animate-connection-highlight");

			// Remove animation class after animation completes
			const timeout = setTimeout(() => {
				wrapperRef.current?.classList.remove("animate-connection-highlight");

				// Clean up URL after animation
				const url = new URL(window.location.href);
				url.searchParams.delete("success");
				url.searchParams.delete("highlight");
				// Only update URL if there were params to remove
				if (success || highlight) {
					router.replace(url.pathname + (url.search ? url.search : ""), { scroll: false });
				}
			}, 3000);

			return () => clearTimeout(timeout);
		}
	}, [searchParams, connectionType, router]);

	return (
		<div ref={wrapperRef} className="rounded-lg">
			{children}
		</div>
	);
};

"use client";

import { useHaptics } from "@/hooks/use-haptics";

/**
 * Mounts the web-haptics singleton so the imperative `haptic()` function
 * works from any component (Button, Switch, etc.) without requiring
 * each one to call `useHaptics()`.
 *
 * Place once near the root of your app (e.g. in layout.tsx or providers.tsx).
 */
export function HapticsProvider({ children }: { children: React.ReactNode }) {
	// Calling the hook registers the singleton trigger
	useHaptics();
	return <>{children}</>;
}

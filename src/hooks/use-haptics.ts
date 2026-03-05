"use client";

/**
 * Web Haptics API hook.
 *
 * Wraps `navigator.vibrate()` with preset patterns for common UI
 * interactions.  Falls back silently on browsers / devices that don't
 * support the Vibration API (iOS Safari, most desktops).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection";

const patterns: Record<HapticPattern, number | number[]> = {
	/** Subtle tap – buttons, list items */
	light: 10,
	/** Standard press – toggles, switches */
	medium: 20,
	/** Strong tap – destructive actions, confirmations */
	heavy: 40,
	/** Double-pulse – copy-to-clipboard, save */
	success: [10, 60, 20],
	/** Triple short burst – validation error */
	warning: [15, 40, 15, 40, 15],
	/** Single long buzz – delete, error toast */
	error: [50, 30, 80],
	/** Ultra-light tap – tab switch, checkbox */
	selection: 6,
};

function canVibrate(): boolean {
	return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/**
 * Fire a haptic vibration pattern.
 *
 * Safe to call unconditionally – no-ops when the Vibration API is
 * unavailable (SSR, iOS, desktop).
 */
export function haptic(pattern: HapticPattern = "light"): void {
	if (!canVibrate()) return;
	try {
		navigator.vibrate(patterns[pattern]);
	} catch {
		// Swallow – some browsers throw in restrictive contexts
	}
}

/**
 * React hook that returns memoised haptic helpers.
 *
 * ```tsx
 * const { tap, toggle, success } = useHaptics();
 * <Button onClick={() => { tap(); doStuff(); }} />
 * ```
 */
export function useHaptics() {
	return {
		/** Light tap – general button presses */
		tap: () => haptic("light"),
		/** Medium pulse – switches, toggles */
		toggle: () => haptic("medium"),
		/** Selection tick – tabs, radio, checkbox */
		selection: () => haptic("selection"),
		/** Double-pulse – copy, save, success */
		success: () => haptic("success"),
		/** Warning burst */
		warning: () => haptic("warning"),
		/** Error buzz */
		error: () => haptic("error"),
		/** Heavy thud – destructive / confirm */
		heavy: () => haptic("heavy"),
		/** Raw pattern access */
		haptic,
	};
}

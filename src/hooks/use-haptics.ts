"use client";

/**
 * Web Haptics hook for ShipKit.
 *
 * Uses the `web-haptics` library which provides:
 * - `navigator.vibrate()` on Android/Chrome
 * - iOS Safari haptics via the `<input type="checkbox" switch>` trick
 * - PWM intensity modulation for perceived vibration strength
 * - Audio debug mode for desktop testing
 *
 * @see https://haptics.lochie.me
 * @see https://github.com/lochie/web-haptics
 */

import { useWebHaptics } from "web-haptics/react";
import type { HapticInput, TriggerOptions } from "web-haptics";

export type HapticPattern =
	| "light"
	| "medium"
	| "heavy"
	| "success"
	| "warning"
	| "error"
	| "selection"
	| "soft"
	| "rigid"
	| "nudge"
	| "buzz";

// Singleton instance for imperative (non-hook) usage
let singletonTrigger: ((input?: HapticInput, opts?: TriggerOptions) => void) | null = null;
let singletonCancel: (() => void) | null = null;

/**
 * Fire a haptic vibration pattern.
 *
 * Safe to call unconditionally — no-ops during SSR and on
 * unsupported devices.
 */
export function haptic(pattern: HapticPattern = "light"): void {
	if (singletonTrigger) {
		singletonTrigger(pattern);
	}
}

/**
 * Cancel any ongoing haptic vibration.
 */
export function hapticCancel(): void {
	if (singletonCancel) {
		singletonCancel();
	}
}

/**
 * React hook that returns memoised haptic helpers.
 *
 * Uses `web-haptics` under the hood for cross-platform support
 * (including iOS Safari via the checkbox switch trick).
 *
 * ```tsx
 * const { tap, toggle, success } = useHaptics();
 * <Button onClick={() => { tap(); doStuff(); }} />
 * ```
 */
export function useHaptics() {
	const { trigger, cancel, isSupported } = useWebHaptics();

	// Register singleton for imperative access
	singletonTrigger = trigger;
	singletonCancel = cancel;

	return {
		/** Light tap — general button presses */
		tap: () => trigger("light"),
		/** Medium pulse — switches, toggles */
		toggle: () => trigger("medium"),
		/** Selection tick — tabs, radio, checkbox */
		selection: () => trigger("selection"),
		/** Double-pulse — copy, save, success */
		success: () => trigger("success"),
		/** Warning burst */
		warning: () => trigger("warning"),
		/** Error buzz */
		error: () => trigger("error"),
		/** Heavy thud — destructive / confirm */
		heavy: () => trigger("heavy"),
		/** Soft cushioned tap */
		soft: () => trigger("soft"),
		/** Hard crisp tap */
		rigid: () => trigger("rigid"),
		/** Reminder nudge */
		nudge: () => trigger("nudge"),
		/** Long buzz */
		buzz: () => trigger("buzz"),
		/** Cancel current vibration */
		cancel,
		/** Whether the device supports haptics */
		isSupported,
		/** Raw trigger — pass any HapticInput */
		trigger,
		/** Legacy pattern access (calls trigger internally) */
		haptic,
	};
}

const isMac = typeof window !== "undefined" && navigator?.platform?.includes("Mac");
const isWindows = typeof window !== "undefined" && navigator?.platform?.includes("Win");

/**
 * Runtime utilities for detecting platform-specific features
 */
export const is = {
	mac: () => {
		if (typeof window === "undefined") return false;
		return window.navigator.platform.toLowerCase().includes("mac");
	},
	windows: () => isWindows,
};

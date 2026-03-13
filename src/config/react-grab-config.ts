import { buildTimeFeatures, preferredAiProvider } from "./features-config";

/*
 * React Grab provider metadata, keyed by AI provider id.
 * Only the client script URL and npm package name are stored here —
 * everything else (env key, resolved value) comes from `preferredAiProvider`.
 */
const REACT_GRAB_PROVIDER_MAP = {
	"claude-code": {
		packageName: "@react-grab/claude-code",
		clientScriptUrl: "https://unpkg.com/@react-grab/claude-code/dist/client.global.js",
	},
	codex: {
		packageName: "@react-grab/codex",
		clientScriptUrl: "https://unpkg.com/@react-grab/codex/dist/client.global.js",
	},
	gemini: {
		packageName: "@react-grab/gemini",
		clientScriptUrl: "https://unpkg.com/@react-grab/gemini/dist/client.global.js",
	},
} as const;

export const reactGrabConfig = {
	enabled: buildTimeFeatures.DEVTOOLS_REACT_GRAB_ENABLED ?? true,
	provider: preferredAiProvider
		? {
				...REACT_GRAB_PROVIDER_MAP[preferredAiProvider.id],
				id: preferredAiProvider.id,
				/** Resolved API key value — already set in process.env by loadEnvConfig. Used to validate presence. */
				env: preferredAiProvider.env,
			}
		: undefined,
} as const;

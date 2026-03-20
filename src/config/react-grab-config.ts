import { buildTimeFeatures, preferredAiProvider } from "./features-config";

/**
 * React Grab provider metadata, keyed by AI provider id.
 *
 * Each provider has:
 * - `packageName`: npm package (already in dependencies)
 * - `clientScriptUrl`: browser-side WebSocket relay loaded via `<Script>`
 * - `serverBin`: CLI that starts the local agent server (spawned by `dev:react-grab`)
 *
 * @see https://react-grab.com/blog/agent
 */
const REACT_GRAB_PROVIDER_MAP = {
  "claude-code": {
    packageName: "@react-grab/claude-code",
    clientScriptUrl: "https://unpkg.com/@react-grab/claude-code@0.1.28/dist/client.global.js",
    serverBin: "react-grab-claude-code",
  },
  codex: {
    packageName: "@react-grab/codex",
    clientScriptUrl: "https://unpkg.com/@react-grab/codex@0.1.28/dist/client.global.js",
    serverBin: "react-grab-codex",
  },
  gemini: {
    packageName: "@react-grab/gemini",
    clientScriptUrl: "https://unpkg.com/@react-grab/gemini@0.1.28/dist/client.global.js",
    serverBin: "react-grab-gemini",
  },
} as const;

export const reactGrabConfig = {
  enabled: buildTimeFeatures.DEVTOOLS_REACT_GRAB_ENABLED ?? true,
  provider: preferredAiProvider
    ? {
        ...REACT_GRAB_PROVIDER_MAP[preferredAiProvider.id],
        id: preferredAiProvider.id,
        /** Resolved API key value — already set in process.env by loadEnvConfig. Used to validate presence. */
        // env: preferredAiProvider.env,
      }
    : undefined,
} as const;

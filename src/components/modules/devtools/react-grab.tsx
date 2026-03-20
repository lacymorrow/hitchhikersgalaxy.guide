import Script from "next/script";
import { reactGrabConfig } from "@/config/react-grab-config";

/**
 * React Grab — select UI elements and edit with AI agents.
 *
 * Loads two scripts in dev mode:
 * 1. Core: instruments React fiber tree, enables ⌘C element selection
 * 2. Provider client: WebSocket relay to the local agent server
 *
 * The provider server must be running alongside the dev server.
 * Use `pnpm dev:react-grab` to start both concurrently.
 *
 * @see https://react-grab.com/blog/agent
 */
export function ReactGrab() {
  if (process.env.NODE_ENV !== "development") return null;
  if (!reactGrabConfig.enabled || !reactGrabConfig.provider) return null;

  return (
    <>
      <Script
        id="react-grab-core"
        src="https://unpkg.com/react-grab@0.1.28/dist/index.global.js"
        crossOrigin="anonymous"
        strategy="beforeInteractive"
      />
      <Script
        id={`react-grab-provider-${reactGrabConfig.provider.id}`}
        src={reactGrabConfig.provider.clientScriptUrl}
        crossOrigin="anonymous"
        strategy="beforeInteractive"
      />
    </>
  );
}

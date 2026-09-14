import { holocron } from "@holocron.so/vite";
import { defineConfig } from "vite";

/*
 * Holocron reads Shipkit's canonical MDX from ../docs rather than keeping its
 * own copy, so the fumadocs and holocron providers always render the same
 * content. `docs.jsonc` navigation is generated from that same tree by
 * ../scripts/generate-holocron-nav.mjs.
 */
export default defineConfig({
  clearScreen: false,
  plugins: [holocron({ pagesDir: "../docs" })],
  server: {
    // pagesDir lives outside this Vite root.
    fs: { allow: [".."] },
  },
});

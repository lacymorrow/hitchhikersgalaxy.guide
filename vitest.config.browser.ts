import path from "node:path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"server-only": path.resolve(__dirname, "./tests/shims/server-only.ts"),
			"next/server": path.resolve(__dirname, "./tests/shims/next-server.ts"),
			"next/link": path.resolve(__dirname, "./tests/shims/next-link.tsx"),
		},
	},
	test: {
		include: ["tests/browser/**/*.test.{ts,tsx}"],
		watch: false,
		setupFiles: ["./tests/setup-env.ts", "./tests/setup.ts"],
		browser: {
			enabled: true,
			name: "chromium",
			// @ts-expect-error - Vitest v4 browser providers are optional deps; this project may not have the provider installed.
			provider: "playwright",
		},
	},
});

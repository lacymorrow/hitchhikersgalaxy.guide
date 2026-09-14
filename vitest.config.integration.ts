/**
 * Vitest configuration for integration tests backed by a real Postgres
 * started via Testcontainers.
 *
 * These tests live in tests/integration/** and exercise service code
 * against a real database — no `vi.mock("@/server/db")` here.
 *
 * Run with: bun run test:integration
 */

import path from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/shims/server-only.ts"),
      "next/server": path.resolve(__dirname, "./tests/shims/next-server.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup-env.ts", "./tests/setup-integration.ts"],
    globalSetup: ["./tests/helpers/global-setup-integration.ts"],
    include: ["tests/integration/**/*.test.{ts,tsx}"],
    // Integration suites must run serially against the shared container.
    // We rely on per-test TRUNCATE for isolation.
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000, // container startup
    watch: false,
  },
});

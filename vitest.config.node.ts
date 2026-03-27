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
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup-env.ts", "./tests/setup.ts"],
    include: ["tests/node/**/*.test.{ts,tsx}"],
    watch: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/**", "src/test/**", "**/*.d.ts", "**/*.config.ts", "**/types/**"],
    },
  },
});

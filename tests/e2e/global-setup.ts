/**
 * Playwright globalSetup: boot a Postgres testcontainer, push the
 * Drizzle schema via the CLI, and stash the connection URL in
 * process.env so the webServer (`next start` in CI, `bun dev` locally)
 * inherits it.
 *
 * Reuses the helpers from tests/helpers/test-db.ts.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { startTestDb } from "../helpers/test-db";

function ensureDockerHost() {
  if (process.env.DOCKER_HOST) return;
  const candidates = [
    `${homedir()}/.docker/run/docker.sock`,
    "/var/run/docker.sock",
    `${homedir()}/.colima/default/docker.sock`,
  ];
  const found = candidates.find((p) => existsSync(p));
  if (found) {
    process.env.DOCKER_HOST = `unix://${found}`;
  }
}

async function globalSetup() {
  if (process.env.E2E_SKIP_DB_SETUP === "1") {
    console.log("[e2e] E2E_SKIP_DB_SETUP=1 → trusting external DATABASE_URL");
    return;
  }
  ensureDockerHost();
  const { url } = await startTestDb();
  process.env.DATABASE_URL = url;
  console.log(`[e2e] Testcontainers Postgres ready at ${url}`);
}

export default globalSetup;

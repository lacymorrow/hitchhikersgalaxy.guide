/**
 * Playwright globalTeardown: stop the Postgres testcontainer started
 * by tests/e2e/global-setup.ts.
 */

import { stopTestDb } from "../helpers/test-db";

async function globalTeardown() {
  if (process.env.E2E_SKIP_DB_SETUP === "1") return;
  await stopTestDb();
}

export default globalTeardown;

# Phase 3 — Test DB infrastructure via Testcontainers

> **Status**: DRAFT — ready to execute once Phase 2 lands.
> **Authored**: 2026-06-24 during Phase 2 finishing.

This is the concrete implementation plan for the third row of
[`MASTER-TEST-PLAN.md`](./MASTER-TEST-PLAN.md). The owner chose Testcontainers
over a static `docker-compose.test.yml` because it auto-lifecycles the
Postgres container per run (no separate setup step) and Bun's
testcontainers integration is solid.

## Definition of done

`bun run test` runs every previously-skipped DB-gated service test against
a real Postgres started by Testcontainers. Zero `describe.skip` lines
remaining with the reason "database not available". Tests still pass.

## Deliverables

### 1. Dependencies

```bash
bun add -d testcontainers @testcontainers/postgresql
```

`testcontainers` is the core library; `@testcontainers/postgresql` is the
Postgres-specific helper that handles ready-checks and JDBC URL building.

### 2. Test setup file

Create `tests/helpers/test-db.ts`:

```ts
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@/server/db/schema";

let container: StartedPostgreSqlContainer | null = null;
let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function startTestDb() {
  if (container) return { db: db!, container };
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("shipkit_test")
    .withUsername("test")
    .withPassword("test")
    .start();
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;
  client = postgres(url);
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
  return { db, container };
}

export async function stopTestDb() {
  await client?.end();
  await container?.stop();
  container = null;
  client = null;
  db = null;
}

export async function resetTestDb() {
  if (!db) throw new Error("Test DB not started");
  // Truncate all tables in dependency order. Adjust list as schema grows.
  await db.execute(`TRUNCATE TABLE
    api_keys, payments, accounts, sessions, team_members, teams, users
    RESTART IDENTITY CASCADE`);
}
```

### 3. Vitest global setup

Update `vitest.config.ts` (and the `.node` variant) to point at a global
setup file:

```ts
test: {
  globalSetup: ["./tests/helpers/global-setup.ts"],
  ...
}
```

`tests/helpers/global-setup.ts`:

```ts
import { startTestDb, stopTestDb } from "./test-db";

export async function setup() {
  await startTestDb();
}

export async function teardown() {
  await stopTestDb();
}
```

Per-test cleanup goes in `tests/setup.ts` (already exists):

```ts
import { afterEach } from "vitest";
import { resetTestDb } from "./helpers/test-db";

afterEach(async () => {
  await resetTestDb();
});
```

### 4. Re-enable the 5 skipped service test files

Remove the documented `// SKIPPED: ... Phase 3 (Testcontainers)` comments
plus the `describe.skip(...)` markers from:

- `tests/unit/server/services/feedback-service.test.ts`
- `tests/unit/server/services/team/team-service.test.ts`
- `tests/unit/server/services/github/github-service.test.ts`
- `tests/unit/server/actions/deployment-actions.test.ts`
- `tests/unit/components/deployments/deployment-actions.test.tsx`
  (this one is component-test; not DB-gated, but tracked for separate
  follow-up — rewrite tests against current component API)

For each: switch `describe.skip` to `describe` and verify the test runs
green against the new test DB.

### 5. Replace the existing `if (!db) return describe.skip(...)` guard

`tests/unit/server/services/team/team-service.test.ts` and
`feedback-service.test.ts` use a conditional wrap. Remove it — `db` will
always be available via globalSetup.

### 6. Documentation

Add a `tests/README.md` (under 50 lines) explaining:

- The chainable mock vs. real-DB choice per test type.
- How to run a single service test against the live container.
- CI implications (the draft workflow at `plans/draft-ci-workflow.yml`
  uses Postgres as a CI service, which is _redundant_ with Testcontainers
  but cheaper than spinning a container on every CI job. Keep CI's
  Postgres service container; let Testcontainers handle local dev).

## Verification gate

```bash
bun run test                  # 198+ passing (5 newly-enabled files contribute ~15 more)
bun run test 2>&1 | grep "describe.skip" -l   # zero matches
```

## STOP conditions

- Docker not available in the test environment (Testcontainers requires
  it). Detect early; offer a `SKIP_TESTCONTAINERS=1` fallback that re-skips
  with a clearer message.
- Migrations fail against fresh Postgres. Usually means a schema bug.
  Investigate before suppressing.
- A test that was skipped because the test itself was broken (not because
  DB was unavailable). Surface and triage individually; do not silently
  enable a broken test.

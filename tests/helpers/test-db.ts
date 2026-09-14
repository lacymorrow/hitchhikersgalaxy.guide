/**
 * Test database helper backed by Testcontainers.
 *
 * Two contexts use this file:
 *   1. globalSetup (the vitest CLI process) — `startTestDb()` boots the
 *      Postgres container, pushes the Drizzle schema via `drizzle-kit
 *      push --force`, and sets `DATABASE_URL` in env so workers inherit it.
 *      `stopTestDb()` shuts it down.
 *   2. Test workers (forked subprocesses) — `getTestDb()` and
 *      `truncateAllTables()` lazily open a postgres-js client against
 *      `process.env.DATABASE_URL`. Worker-local state only.
 *
 * Schema is pushed via the drizzle-kit CLI (subprocess) because this
 * repo has no generated migration files — production deploys via
 * `bun run db:push`. Same code path means schema drift surfaces here
 * before it surfaces in prod.
 */

import { spawn } from "node:child_process";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import * as schema from "@/server/db/schema";

let container: StartedPostgreSqlContainer | null = null;
let workerClient: ReturnType<typeof postgres> | null = null;
let workerDb: PostgresJsDatabase<typeof schema> | null = null;

function pushSchemaViaDrizzleKit(databaseUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("bunx", ["drizzle-kit", "push", "--force", "--verbose=false"], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    proc.stdout?.on("data", () => {
      /* drain */
    });
    proc.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.once("error", reject);
    proc.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`drizzle-kit push exited ${code}: ${stderr}`));
    });
  });
}

/**
 * globalSetup-only: ensure a Postgres is ready and the schema is
 * pushed. Returns the URL so the caller can stash it in env for
 * workers.
 *
 * If `USE_EXTERNAL_DB=1` and `DATABASE_URL` is set, we use that DB
 * (e.g. a CI service container) and only push the schema — no
 * testcontainer is started. Otherwise we boot one via Testcontainers.
 */
export async function startTestDb(): Promise<{ url: string }> {
  if (process.env.USE_EXTERNAL_DB === "1") {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "USE_EXTERNAL_DB=1 but DATABASE_URL is not set. Provide one or unset USE_EXTERNAL_DB."
      );
    }
    await pushSchemaViaDrizzleKit(url);
    return { url };
  }

  if (container) {
    return { url: container.getConnectionUri() };
  }

  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("shipkit_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const url = container.getConnectionUri();
  await pushSchemaViaDrizzleKit(url);
  return { url };
}

export async function stopTestDb(): Promise<void> {
  await workerClient?.end({ timeout: 5 });
  await container?.stop();
  workerClient = null;
  workerDb = null;
  container = null;
}

/**
 * Worker-side: open (or reuse) a connection to the testcontainer
 * Postgres started by globalSetup. Throws if DATABASE_URL is not set.
 */
export function getTestDb(): PostgresJsDatabase<typeof schema> {
  if (workerDb) return workerDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not set. Ensure vitest globalSetup ran startTestDb().");
  }
  workerClient = postgres(url, { max: 5 });
  workerDb = drizzle(workerClient, { schema });
  return workerDb;
}

/**
 * Truncate every user table in the public schema. Cheaper than
 * re-pushing the schema between tests; CASCADE handles FK ordering.
 */
export async function truncateAllTables(): Promise<void> {
  const db = getTestDb();
  const client = workerClient;
  if (!client) throw new Error("Worker client not initialized");
  const rows = await client<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'drizzle%'
  `;
  if (rows.length === 0) return;
  const tableList = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
  await db.execute(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
}

export async function closeWorkerConnection(): Promise<void> {
  await workerClient?.end({ timeout: 5 });
  workerClient = null;
  workerDb = null;
}

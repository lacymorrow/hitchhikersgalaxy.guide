/**
 * Vitest globalSetup for the integration project. Runs once per test run.
 * Starts the Postgres testcontainer and pushes the Drizzle schema, then
 * tears it down when the suite finishes.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { startTestDb, stopTestDb } from "./test-db";

function ensureDockerHost() {
  if (process.env.DOCKER_HOST) return;
  const candidates = [
    `${homedir()}/.docker/run/docker.sock`, // Docker Desktop on macOS
    "/var/run/docker.sock", // Linux default
    `${homedir()}/.colima/default/docker.sock`, // Colima
  ];
  const found = candidates.find((p) => existsSync(p));
  if (found) {
    process.env.DOCKER_HOST = `unix://${found}`;
  }
}

export async function setup() {
  ensureDockerHost();
  const { url } = await startTestDb();
  process.env.DATABASE_URL = url;
  process.env.TEST_DATABASE_URL = url;
}

export async function teardown() {
  await stopTestDb();
}

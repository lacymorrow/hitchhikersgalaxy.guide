/**
 * Setup file for the integration vitest project.
 *
 * Critical differences vs. tests/setup.ts:
 *   - Does NOT mock `@/server/db`. Integration tests hit the real
 *     testcontainer Postgres started in globalSetup.
 *   - Truncates user tables after every test so each spec gets a clean
 *     slate without paying for a fresh container.
 */

import "@testing-library/jest-dom";
import * as matchers from "@testing-library/jest-dom/matchers";
import { afterEach, beforeAll, expect } from "vitest";
import { truncateAllTables } from "./helpers/test-db";

expect.extend(matchers);

beforeAll(() => {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Invariant: AsyncLocalStorage accessed in runtime")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(async () => {
  await truncateAllTables();
});

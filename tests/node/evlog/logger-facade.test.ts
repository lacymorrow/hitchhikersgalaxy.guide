import { afterEach, describe, expect, it, vi } from "vitest";

const flush = () => new Promise((resolve) => setTimeout(resolve, 25));

describe("logger facade (evlog trial)", () => {
  afterEach(async () => {
    // initLogger state is process-wide; clear the test drain so other suites
    // are unaffected.
    const { initLogger } = await import("evlog");
    initLogger({});
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("keeps the console-backed behavior when the flag is off", async () => {
    vi.resetModules();
    vi.stubEnv("ENABLE_EVLOG", "");
    const { logger } = await import("@/lib/logger");
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    expect(() => logger.info("plain message", { requestId: "req_1" })).not.toThrow();

    expect(spy).toHaveBeenCalledWith("plain message", { requestId: "req_1" });
  });

  it("preserves the full call surface", async () => {
    vi.resetModules();
    vi.stubEnv("ENABLE_EVLOG", "");
    const { logger } = await import("@/lib/logger");

    for (const level of ["info", "warn", "error", "debug", "log"] as const) {
      expect(typeof logger[level]).toBe("function");
    }
  });

  it("routes logs through evlog (and its drain) when the flag is on", async () => {
    vi.resetModules();
    vi.stubEnv("ENABLE_EVLOG", "true");

    const events: unknown[] = [];
    const { initLogger } = await import("evlog");
    initLogger({
      silent: true,
      drain: (ctx) => {
        events.push(ctx.event);
      },
    });

    const { logger } = await import("@/lib/logger");
    await flush(); // let the facade's lazy evlog import settle

    logger.info("evlog-routed-message", { requestId: "req_2" });
    await flush(); // drains are fire-and-forget

    expect(JSON.stringify(events)).toContain("evlog-routed-message");
  });
});

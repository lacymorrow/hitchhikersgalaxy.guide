import { afterEach, describe, expect, it, vi } from "vitest";

const loadService = async (opts: {
  env?: Record<string, unknown>;
  getSession?: () => unknown;
  handler?: () => unknown;
}) => {
  vi.resetModules();
  vi.doMock("@/env", () => ({ env: opts.env ?? {} }));
  vi.doMock("@/server/better-auth/config", () => ({
    auth: {
      api: { getSession: opts.getSession ?? (() => null) },
      handler: opts.handler ?? (() => new Response("ok")),
    },
  }));
  return await import("@/server/better-auth/service");
};

describe("better auth service", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
    vi.doUnmock("@/server/better-auth/config");
    vi.restoreAllMocks();
  });

  it("reports configured from the feature flag", async () => {
    const off = await loadService({ env: { NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: false } });
    expect(off.isConfigured()).toBe(false);

    const on = await loadService({ env: { NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true } });
    expect(on.isConfigured()).toBe(true);
  });

  it("lists only the providers whose flags are on", async () => {
    const { getConfiguredProviders } = await loadService({
      env: {
        NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: true,
        NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: false,
        NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: true,
      },
    });
    expect(getConfiguredProviders()).toEqual(["google", "discord"]);
  });

  it("passes the request headers through to getSession", async () => {
    const spy = vi.fn().mockResolvedValue({ user: { id: "u1" } });
    const { getSession } = await loadService({ getSession: spy });
    const request = new Request("https://example.test/api/better-auth/session", {
      headers: { cookie: "session=abc" },
    });

    await expect(getSession(request)).resolves.toEqual({ user: { id: "u1" } });
    expect(spy).toHaveBeenCalledWith({ headers: request.headers });
  });

  it("returns null instead of throwing when the session lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { getSession } = await loadService({
      getSession: () => {
        throw new Error("database is down");
      },
    });
    await expect(getSession(new Request("https://example.test/"))).resolves.toBeNull();
  });

  it("answers 500 instead of throwing when the handler fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { handleAuthRequest } = await loadService({
      handler: () => {
        throw new Error("handler blew up");
      },
    });
    const response = await handleAuthRequest(new Request("https://example.test/"));
    expect(response.status).toBe(500);
  });
});

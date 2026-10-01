import { afterEach, describe, expect, it, vi } from "vitest";

const ROUTE = "@/app/(app)/(authentication)/api/better-auth/[...path]/route";

const loadRoute = async (enabled: boolean, handler = vi.fn(() => new Response("ok"))) => {
  vi.resetModules();
  vi.doMock("@/env", () => ({ env: { NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: enabled } }));
  vi.doMock("@/server/better-auth/config", () => ({ auth: { handler } }));
  return { route: await import(ROUTE), handler };
};

describe("better auth route", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
    vi.doUnmock("@/server/better-auth/config");
  });

  it("answers 404 on both verbs when the feature is off", async () => {
    const { route, handler } = await loadRoute(false);
    const request = new Request("https://example.test/api/better-auth/session");

    expect((await route.GET(request)).status).toBe(404);
    expect((await route.POST(request)).status).toBe(404);
    // The config module must never be reached while the feature is off: it
    // throws without a database connection.
    expect(handler).not.toHaveBeenCalled();
  });

  it("hands the request to the better auth handler when the feature is on", async () => {
    const { route, handler } = await loadRoute(true);
    const request = new Request("https://example.test/api/better-auth/session");

    expect((await route.GET(request)).status).toBe(200);
    expect((await route.POST(request)).status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(request);
  });
});

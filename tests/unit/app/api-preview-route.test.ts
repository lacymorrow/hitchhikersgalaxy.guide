import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let mockPreviewSecret: string | undefined;
let mockCookieStore: Record<string, string> = {};
const deletedCookies: string[] = [];
const setCookies: Array<{ name: string; value: string; options: any }> = [];

vi.mock("@/env", () => ({
  env: new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "PREVIEW_SECRET") return mockPreviewSecret;
        return undefined;
      },
    }
  ),
}));

vi.mock("@/lib/preview-flags", async () => {
  const actual = await vi.importActual<typeof import("@/lib/preview-flags")>("@/lib/preview-flags");
  return {
    ...actual,
    getOverrides: vi.fn(async () => {
      const raw = mockCookieStore._shipkit_preview;
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
        const result: Record<string, boolean> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "boolean") result[key] = value;
        }
        return result;
      } catch {
        return {};
      }
    }),
  };
});

vi.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  }

  const MockNextResponse = {
    json(body: unknown, init?: { status?: number }) {
      return {
        type: "json",
        body,
        status: init?.status ?? 200,
        cookies: {
          set: () => {},
          delete: () => {},
        },
      };
    },
    redirect(url: URL | string) {
      const _setCookies: Array<{ name: string; value: string; options: any }> = [];
      const _deletedCookies: string[] = [];
      return {
        type: "redirect",
        url: typeof url === "string" ? url : url.toString(),
        status: 307,
        cookies: {
          set(name: string, value: string, options?: any) {
            _setCookies.push({ name, value, options });
            setCookies.push({ name, value, options });
          },
          delete(name: string) {
            _deletedCookies.push(name);
            deletedCookies.push(name);
          },
        },
        _setCookies,
        _deletedCookies,
      };
    },
  };

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

import type { NextRequest } from "next/server";
import { NextRequest as MockNextRequest } from "next/server";
import { GET } from "@/app/(app)/api/flags/route";

function makeRequest(url: string): NextRequest {
  return new (MockNextRequest as any)(url) as NextRequest;
}

describe("/api/flags route", () => {
  beforeEach(() => {
    mockPreviewSecret = undefined;
    mockCookieStore = {};
    deletedCookies.length = 0;
    setCookies.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("authentication", () => {
    it("allows open access when PREVIEW_SECRET is unset", async () => {
      mockPreviewSecret = undefined;
      const req = await makeRequest("http://localhost:3000/api/flags?feature_flag_database=1");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
    });

    it("returns 401 when PREVIEW_SECRET is set and no token provided", async () => {
      mockPreviewSecret = "my-secret-token";
      const req = await makeRequest("http://localhost:3000/api/flags?feature_flag_database=1");
      const res = (await GET(req)) as any;
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid token" });
    });

    it("returns 401 when PREVIEW_SECRET is set and wrong token provided", async () => {
      mockPreviewSecret = "my-secret-token";
      const req = await makeRequest(
        "http://localhost:3000/api/flags?token=wrong-token&feature_flag_database=1"
      );
      const res = (await GET(req)) as any;
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Invalid token" });
    });

    it("allows access when correct token is provided", async () => {
      mockPreviewSecret = "my-secret-token";
      const req = await makeRequest(
        "http://localhost:3000/api/flags?token=my-secret-token&feature_flag_database=1"
      );
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
    });
  });

  describe("setting flags", () => {
    it("sets cookie with correct JSON for feature_flag_database=1&feature_flag_mdx=0", async () => {
      const req = await makeRequest(
        "http://localhost:3000/api/flags?feature_flag_database=1&feature_flag_mdx=0"
      );
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
      expect(setCookies.length).toBe(1);
      const cookie = setCookies[0];
      expect(cookie.name).toBe("_shipkit_preview");
      const parsed = JSON.parse(cookie.value);
      expect(parsed).toEqual({
        DATABASE_ENABLED: true,
        MDX_ENABLED: false,
      });
    });

    it("sets cookie with httpOnly, sameSite lax, path /", async () => {
      const req = await makeRequest("http://localhost:3000/api/flags?feature_flag_database=1");
      const res = (await GET(req)) as any;
      const cookie = setCookies[0];
      expect(cookie.options.httpOnly).toBe(true);
      expect(cookie.options.sameSite).toBe("lax");
      expect(cookie.options.path).toBe("/");
      expect(cookie.options.maxAge).toBe(60 * 60 * 8);
    });
  });

  describe("clearing overrides", () => {
    it("deletes cookie when clear=1", async () => {
      const req = await makeRequest("http://localhost:3000/api/flags?clear=1");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
      expect(deletedCookies).toContain("_shipkit_preview");
    });

    it("deletes cookie with clear=true", async () => {
      const req = await makeRequest("http://localhost:3000/api/flags?clear=true");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
      expect(deletedCookies).toContain("_shipkit_preview");
    });
  });

  describe("merging overrides", () => {
    it("merges new overrides with existing cookie values", async () => {
      mockCookieStore._shipkit_preview = JSON.stringify({
        DATABASE_ENABLED: true,
      });
      const req = await makeRequest("http://localhost:3000/api/flags?feature_flag_mdx=0");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
      const cookie = setCookies[0];
      const parsed = JSON.parse(cookie.value);
      expect(parsed).toEqual({
        DATABASE_ENABLED: true,
        MDX_ENABLED: false,
      });
    });

    it("new values override existing values for same flag", async () => {
      mockCookieStore._shipkit_preview = JSON.stringify({
        DATABASE_ENABLED: true,
      });
      const req = await makeRequest("http://localhost:3000/api/flags?feature_flag_database=0");
      const res = (await GET(req)) as any;
      const cookie = setCookies[0];
      const parsed = JSON.parse(cookie.value);
      expect(parsed).toEqual({ DATABASE_ENABLED: false });
    });
  });

  describe("redirect parameter", () => {
    it("redirects to / by default", async () => {
      const req = await makeRequest("http://localhost:3000/api/flags?feature_flag_database=1");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
      expect(res.url).toContain("/");
    });

    it("redirects to specified path", async () => {
      const req = await makeRequest(
        "http://localhost:3000/api/flags?feature_flag_database=1&redirect=/dashboard"
      );
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
      expect(new URL(res.url).pathname).toBe("/dashboard");
    });

    it("redirects to / when redirect param is an external URL (safety)", async () => {
      const req = await makeRequest(
        "http://localhost:3000/api/flags?feature_flag_database=1&redirect=https://evil.com"
      );
      const res = (await GET(req)) as any;
      expect(new URL(res.url).pathname).toBe("/");
    });

    it("redirects to / when redirect param starts with //", async () => {
      const req = await makeRequest(
        "http://localhost:3000/api/flags?feature_flag_database=1&redirect=//evil.com"
      );
      const res = (await GET(req)) as any;
      expect(new URL(res.url).pathname).toBe("/");
    });

    it("redirect works with clear param", async () => {
      const req = await makeRequest("http://localhost:3000/api/flags?clear=1&redirect=/settings");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("redirect");
      expect(new URL(res.url).pathname).toBe("/settings");
      expect(deletedCookies).toContain("_shipkit_preview");
    });
  });

  describe("no params (current overrides)", () => {
    it("returns current overrides as JSON when no feature_flag_ params", async () => {
      mockCookieStore._shipkit_preview = JSON.stringify({
        DATABASE_ENABLED: true,
        MDX_ENABLED: false,
      });
      const req = await makeRequest("http://localhost:3000/api/flags");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("json");
      expect(res.body.overrides).toEqual({
        DATABASE_ENABLED: true,
        MDX_ENABLED: false,
      });
      expect(res.body.hint).toBeDefined();
    });

    it("returns empty overrides when no cookie and no params", async () => {
      const req = await makeRequest("http://localhost:3000/api/flags");
      const res = (await GET(req)) as any;
      expect(res.type).toBe("json");
      expect(res.body.overrides).toEqual({});
    });
  });

  describe("edge cases", () => {
    it("rejects cookie overflow (>2048 bytes)", async () => {
      const bigOverrides: Record<string, boolean> = {};
      for (let i = 0; i < 200; i++) {
        bigOverrides[`FLAG_${i}_ENABLED`] = true;
      }
      mockCookieStore._shipkit_preview = JSON.stringify(bigOverrides);
      const req = await makeRequest("http://localhost:3000/api/flags?feature_flag_database=1");
      const res = (await GET(req)) as any;
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Too many overrides");
    });
  });
});

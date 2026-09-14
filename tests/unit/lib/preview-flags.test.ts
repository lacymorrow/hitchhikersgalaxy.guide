import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => {
  let cookieStore: Record<string, string> = {};
  return {
    cookies: vi.fn(async () => ({
      get: (name: string) => {
        const value = cookieStore[name];
        return value !== undefined ? { value } : undefined;
      },
    })),
    __setCookie: (name: string, value: string) => {
      cookieStore[name] = value;
    },
    __clearCookies: () => {
      cookieStore = {};
    },
  };
});

import {
  getOverrides,
  isFeatureEnabledWithOverrides,
  PREVIEW_COOKIE,
  parseOverridesFromParams,
  parseTruthy,
  QUERY_PARAM_PREFIX,
} from "@/lib/preview-flags";

const headersMock = await import("next/headers");
const setCookie = (headersMock as any).__setCookie as (name: string, value: string) => void;
const clearCookies = (headersMock as any).__clearCookies as () => void;

describe("preview-flags", () => {
  beforeEach(() => {
    clearCookies();
  });

  describe("constants", () => {
    it("PREVIEW_COOKIE is _shipkit_preview", () => {
      expect(PREVIEW_COOKIE).toBe("_shipkit_preview");
    });

    it("QUERY_PARAM_PREFIX is feature_flag_", () => {
      expect(QUERY_PARAM_PREFIX).toBe("feature_flag_");
    });
  });

  describe("parseTruthy", () => {
    it.each(["1", "true", "on", "yes", "enable", "enabled"])(
      "returns true for truthy value '%s'",
      (value) => {
        expect(parseTruthy(value)).toBe(true);
      }
    );

    it.each(["0", "false", "off", "no", "disable", "disabled"])(
      "returns false for falsy value '%s'",
      (value) => {
        expect(parseTruthy(value)).toBe(false);
      }
    );

    it("is case-insensitive", () => {
      expect(parseTruthy("TRUE")).toBe(true);
      expect(parseTruthy("False")).toBe(false);
      expect(parseTruthy("ON")).toBe(true);
      expect(parseTruthy("OFF")).toBe(false);
    });

    it("trims whitespace", () => {
      expect(parseTruthy("  true  ")).toBe(true);
      expect(parseTruthy("  0  ")).toBe(false);
    });

    it("returns undefined for unrecognized values", () => {
      expect(parseTruthy("maybe")).toBeUndefined();
      expect(parseTruthy("2")).toBeUndefined();
      expect(parseTruthy("")).toBeUndefined();
      expect(parseTruthy("yep")).toBeUndefined();
    });
  });

  describe("parseOverridesFromParams", () => {
    it("parses feature_flag_database=1 and feature_flag_mdx=0", () => {
      const params = new URLSearchParams("feature_flag_database=1&feature_flag_mdx=0");
      const result = parseOverridesFromParams(params);
      expect(result).toEqual({
        DATABASE_ENABLED: true,
        MDX_ENABLED: false,
      });
    });

    it("ignores non-feature-flag params", () => {
      const params = new URLSearchParams(
        "token=secret&redirect=/dashboard&feature_flag_database=1"
      );
      const result = parseOverridesFromParams(params);
      expect(result).toEqual({ DATABASE_ENABLED: true });
    });

    it("ignores invalid flag names", () => {
      const params = new URLSearchParams("feature_flag_nonexistent=1");
      const result = parseOverridesFromParams(params);
      expect(result).toEqual({});
    });

    it("ignores params with unrecognized truthy values", () => {
      const params = new URLSearchParams("feature_flag_database=maybe");
      const result = parseOverridesFromParams(params);
      expect(result).toEqual({});
    });

    it("returns empty object when no feature_flag_ params present", () => {
      const params = new URLSearchParams("clear=1&redirect=/");
      const result = parseOverridesFromParams(params);
      expect(result).toEqual({});
    });

    it("handles multiple flags", () => {
      const params = new URLSearchParams(
        "feature_flag_database=1&feature_flag_mdx=0&feature_flag_pwa=true&feature_flag_auth_github=off"
      );
      const result = parseOverridesFromParams(params);
      expect(result).toEqual({
        DATABASE_ENABLED: true,
        MDX_ENABLED: false,
        PWA_ENABLED: true,
        AUTH_GITHUB_ENABLED: false,
      });
    });
  });

  describe("getOverrides", () => {
    it("returns empty object when no cookie is set", async () => {
      const result = await getOverrides();
      expect(result).toEqual({});
    });

    it("returns parsed overrides from cookie", async () => {
      setCookie(PREVIEW_COOKIE, JSON.stringify({ DATABASE_ENABLED: true, MDX_ENABLED: false }));
      const result = await getOverrides();
      expect(result).toEqual({ DATABASE_ENABLED: true, MDX_ENABLED: false });
    });

    it("ignores invalid flag names in cookie", async () => {
      setCookie(
        PREVIEW_COOKIE,
        JSON.stringify({
          DATABASE_ENABLED: true,
          FAKE_FLAG: true,
        })
      );
      const result = await getOverrides();
      expect(result).toEqual({ DATABASE_ENABLED: true });
    });

    it("ignores non-boolean values in cookie", async () => {
      setCookie(
        PREVIEW_COOKIE,
        JSON.stringify({
          DATABASE_ENABLED: true,
          MDX_ENABLED: "yes",
        })
      );
      const result = await getOverrides();
      expect(result).toEqual({ DATABASE_ENABLED: true });
    });

    it("returns empty object for malformed JSON", async () => {
      setCookie(PREVIEW_COOKIE, "not-json");
      const result = await getOverrides();
      expect(result).toEqual({});
    });

    it("returns empty object for array JSON", async () => {
      setCookie(PREVIEW_COOKIE, "[1,2,3]");
      const result = await getOverrides();
      expect(result).toEqual({});
    });
  });

  describe("isFeatureEnabledWithOverrides", () => {
    it("returns override value when flag is overridden", async () => {
      setCookie(PREVIEW_COOKIE, JSON.stringify({ DATABASE_ENABLED: false }));
      const result = await isFeatureEnabledWithOverrides("DATABASE_ENABLED");
      expect(result).toBe(false);
    });

    it("falls back to build-time value when no override", async () => {
      const result = await isFeatureEnabledWithOverrides("DATABASE_ENABLED");
      expect(typeof result).toBe("boolean");
    });

    it("returns false for unknown flag with no override", async () => {
      const result = await isFeatureEnabledWithOverrides("TOTALLY_UNKNOWN_FLAG");
      expect(result).toBe(false);
    });
  });
});

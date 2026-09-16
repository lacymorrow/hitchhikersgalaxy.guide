import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The feature flags are optional booleans: unset is `undefined`, and an explicit
 * `=false` in the environment is `false`. A `??` chain over them stops at the
 * first non-nullish value, so a deployment that turns Resend off explicitly and
 * GitHub on used to fall all the way through to guest mode with no auth at all.
 */

type Flags = Record<string, boolean | undefined>;

const loadStrategy = async (flags: Flags) => {
  vi.resetModules();
  vi.doMock("@/env", () => ({ env: flags }));
  return await import("@/lib/auth/auth-strategy");
};

describe("getAuthStrategy", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
  });

  it("reports guest mode when nothing is configured", async () => {
    const { getAuthStrategy, isAuthenticationAvailable } = await loadStrategy({});
    expect(getAuthStrategy()).toBe("guest");
    expect(isAuthenticationAvailable()).toBe(false);
  });

  it("reports authjs when a provider is enabled", async () => {
    const { getAuthStrategy, isAuthJSActive } = await loadStrategy({
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
    });
    expect(getAuthStrategy()).toBe("authjs");
    expect(isAuthJSActive()).toBe(true);
  });

  it("still reports authjs when an earlier provider is explicitly disabled", async () => {
    const { getAuthStrategy } = await loadStrategy({
      NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
    });
    expect(getAuthStrategy()).toBe("authjs");
  });

  it("reports guest when every provider is explicitly disabled", async () => {
    const { getAuthStrategy, isGuestModeActive } = await loadStrategy({
      NEXT_PUBLIC_FEATURE_AUTH_RESEND_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GOOGLE_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_DISCORD_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_GITLAB_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_BITBUCKET_ENABLED: false,
      NEXT_PUBLIC_FEATURE_AUTH_TWITTER_ENABLED: false,
    });
    expect(getAuthStrategy()).toBe("guest");
    expect(isGuestModeActive()).toBe(true);
  });

  it("does not claim Clerk is active", async () => {
    const { isClerkActive } = await loadStrategy({
      NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED: true,
    });
    expect(isClerkActive()).toBe(false);
  });
});

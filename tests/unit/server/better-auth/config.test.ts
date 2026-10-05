import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Better Auth went from 1.4 to 1.7 with nothing in the suite exercising it, so a
 * breaking change in betterAuth(), the drizzle adapter, or the option shape would
 * only have surfaced at runtime. These build the real instance against a stub
 * database and assert the surface the app actually calls.
 */

const loadConfig = async (
  db: unknown,
  env: Record<string, unknown> = {},
  resend: unknown = null
) => {
  vi.resetModules();
  vi.doMock("@/server/db", () => ({ db }));
  vi.doMock("@/env", () => ({ env: { BETTER_AUTH_SECRET: "test-secret", ...env } }));
  vi.doMock("@/config/base-url", () => ({ BASE_URL: "https://example.test" }));
  vi.doMock("@/lib/resend", () => ({ resend }));
  return await import("@/server/better-auth/config");
};

// The drizzle adapter only touches the database when a request comes in, so a
// stub is enough to build the instance.
const stubDb = { _: { fullSchema: {} }, query: {} };

// Building a real Better Auth instance pays the cost of importing the package,
// which is well past the 5s default when the whole suite runs in parallel.
const BUILD_TIMEOUT = 45_000;

describe("better auth config", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/server/db");
    vi.doUnmock("@/env");
    vi.doUnmock("@/config/base-url");
    vi.doUnmock("@/lib/resend");
  });

  it(
    "refuses to build without a database",
    async () => {
      await expect(loadConfig(null)).rejects.toThrow(/requires a database connection/i);
    },
    BUILD_TIMEOUT
  );

  it(
    "exposes the handler and session API the app calls",
    async () => {
      const { auth } = await loadConfig(stubDb);
      expect(typeof auth.handler).toBe("function");
      expect(typeof auth.api.getSession).toBe("function");
    },
    BUILD_TIMEOUT
  );

  it(
    "registers a social provider only when both halves of the pair are set",
    async () => {
      const { auth } = await loadConfig(stubDb, {
        AUTH_GITHUB_ID: "gh-id",
        AUTH_GITHUB_SECRET: "gh-secret",
        AUTH_GOOGLE_ID: "google-id-without-secret",
      });
      const providers = auth.options.socialProviders ?? {};
      expect(Object.keys(providers)).toEqual(["github"]);
    },
    BUILD_TIMEOUT
  );

  it(
    "carries the secret and base URL through to the instance",
    async () => {
      const { auth } = await loadConfig(stubDb, {
        BETTER_AUTH_BASE_URL: "https://auth.example.test",
      });
      expect(auth.options.secret).toBe("test-secret");
      expect(auth.options.baseURL).toBe("https://auth.example.test");
      expect(auth.options.trustedOrigins).toContain("https://auth.example.test");
    },
    BUILD_TIMEOUT
  );

  it(
    "only requires email verification when there is a way to send the email",
    async () => {
      const { auth: withoutResend } = await loadConfig(stubDb);
      expect(withoutResend.options.emailAndPassword?.enabled).toBe(true);
      expect(withoutResend.options.emailAndPassword?.requireEmailVerification).toBe(false);

      const { auth: withResend } = await loadConfig(stubDb, {}, { emails: { send: vi.fn() } });
      expect(withResend.options.emailAndPassword?.requireEmailVerification).toBe(true);
    },
    BUILD_TIMEOUT
  );

  it(
    "mounts under /api/better-auth so it never collides with Auth.js",
    async () => {
      const { auth, BETTER_AUTH_BASE_PATH } = await loadConfig(stubDb);
      expect(BETTER_AUTH_BASE_PATH).toBe("/api/better-auth");
      expect(auth.options.basePath).toBe("/api/better-auth");
    },
    BUILD_TIMEOUT
  );

  it(
    "maps its models onto the app's own auth tables",
    async () => {
      const { auth } = await loadConfig(stubDb);
      expect(auth.options.user?.fields).toEqual({ emailVerified: "emailVerifiedFlag" });
      expect(auth.options.session?.fields).toEqual({ token: "sessionToken", expiresAt: "expires" });
      expect(auth.options.account?.fields).toEqual({
        accountId: "providerAccountId",
        providerId: "provider",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
      });
      expect(auth.options.verification?.fields).toEqual({ value: "token", expiresAt: "expires" });
      // Sign-up bodies must not be able to set their own role.
      expect(auth.options.user?.additionalFields?.role?.input).toBe(false);
    },
    BUILD_TIMEOUT
  );

  it(
    "fills the Auth.js account type and verification timestamp from hooks",
    async () => {
      const { auth } = await loadConfig(stubDb);
      const hooks = auth.options.databaseHooks;
      const account = await hooks?.account?.create?.before?.(
        { providerId: "credential", accountId: "u1", userId: "u1" } as never,
        null
      );
      expect((account as { data: { type: string } }).data.type).toBe("credentials");
      const oauth = await hooks?.account?.create?.before?.(
        { providerId: "github", accountId: "1", userId: "u1" } as never,
        null
      );
      expect((oauth as { data: { type: string } }).data.type).toBe("oauth");

      const unverified = await hooks?.user?.create?.before?.(
        { email: "a@example.test", emailVerified: false } as never,
        null
      );
      expect(
        (unverified as { data: { emailVerifiedAt: unknown } }).data.emailVerifiedAt
      ).toBeNull();
      const verified = await hooks?.user?.create?.before?.(
        { email: "a@example.test", emailVerified: true } as never,
        null
      );
      expect(
        (verified as { data: { emailVerifiedAt: unknown } }).data.emailVerifiedAt
      ).toBeInstanceOf(Date);
    },
    BUILD_TIMEOUT
  );
});

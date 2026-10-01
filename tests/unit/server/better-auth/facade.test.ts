// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The facade turns Better Auth's `{ session, user }` into the Auth.js `Session`
 * the rest of the app reads through `auth()`, and gives `signIn` / `signOut`
 * from `@/server/auth` their Auth.js semantics on top of Better Auth's API.
 */

class FakeAPIError extends Error {
  statusCode: number;
  body: { message?: string };
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.body = { message };
  }
}

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

const api = {
  getSession: vi.fn(),
  signInEmail: vi.fn(),
  signInSocial: vi.fn(),
  signOut: vi.fn(),
  signUpEmail: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
};

const requestHeaders = new Headers({ cookie: "better-auth.session_token=abc" });

const loadFacade = async () => {
  vi.resetModules();
  vi.doMock("better-auth/api", () => ({ APIError: FakeAPIError }));
  vi.doMock("next/headers", () => ({ headers: vi.fn(async () => requestHeaders) }));
  vi.doMock("next/navigation", () => ({ redirect }));
  vi.doMock("@/config/base-url", () => ({ BASE_URL: "https://example.test" }));
  vi.doMock("@/lib/logger", () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }));
  vi.doMock("@/server/better-auth/config", () => ({ auth: { api } }));
  return await import("@/server/better-auth/facade");
};

const expiresAt = new Date("2030-01-02T03:04:05.000Z");
const baseUser = { id: "u1", email: "a@example.test", name: "Ada", image: null };

describe("better auth facade", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("better-auth/api");
    vi.doUnmock("next/headers");
    vi.doUnmock("next/navigation");
    vi.doUnmock("@/config/base-url");
    vi.doUnmock("@/lib/logger");
    vi.doUnmock("@/server/better-auth/config");
    for (const fn of Object.values(api)) fn.mockReset();
    redirect.mockClear();
  });

  describe("mapBetterAuthSession", () => {
    it("returns null when signed out", async () => {
      const { mapBetterAuthSession } = await loadFacade();
      expect(mapBetterAuthSession(null)).toBeNull();
    });

    it("produces the Auth.js session shape", async () => {
      const { mapBetterAuthSession } = await loadFacade();
      const session = mapBetterAuthSession({
        session: { expiresAt },
        user: { ...baseUser, role: "user", emailVerified: false, emailVerifiedAt: null },
      });
      expect(session).toEqual({
        expires: "2030-01-02T03:04:05.000Z",
        user: expect.objectContaining({
          id: "u1",
          email: "a@example.test",
          name: "Ada",
          image: null,
          emailVerified: null,
          role: "user",
          isAdmin: false,
        }),
      });
    });

    it("keeps the admin role and flags isAdmin", async () => {
      const { mapBetterAuthSession } = await loadFacade();
      const session = mapBetterAuthSession({
        session: { expiresAt: expiresAt.toISOString() },
        user: { ...baseUser, role: "admin" },
      });
      expect(session?.user.role).toBe("admin");
      expect(session?.user.isAdmin).toBe(true);
    });

    it("refuses unknown roles rather than passing them through", async () => {
      const { mapBetterAuthSession } = await loadFacade();
      const session = mapBetterAuthSession({
        session: { expiresAt },
        user: { ...baseUser, role: "superuser" },
      });
      expect(session?.user.role).toBe("user");
    });

    it("prefers the Auth.js verification timestamp over the boolean", async () => {
      const { mapBetterAuthSession } = await loadFacade();
      const verifiedAt = "2026-05-06T07:08:09.000Z";
      const session = mapBetterAuthSession({
        session: { expiresAt },
        user: { ...baseUser, emailVerified: true, emailVerifiedAt: verifiedAt },
      });
      expect(session?.user.emailVerified).toEqual(new Date(verifiedAt));
    });

    it("falls back to a fresh timestamp when only the boolean is set", async () => {
      const { mapBetterAuthSession } = await loadFacade();
      const session = mapBetterAuthSession({
        session: { expiresAt },
        user: { ...baseUser, emailVerified: true },
      });
      expect(session?.user.emailVerified).toBeInstanceOf(Date);
    });

    it("carries created and updated dates through as Dates", async () => {
      const { mapBetterAuthSession } = await loadFacade();
      const session = mapBetterAuthSession({
        session: { expiresAt },
        user: { ...baseUser, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: expiresAt },
      });
      expect(session?.user.createdAt).toEqual(new Date("2026-01-01T00:00:00.000Z"));
      expect(session?.user.updatedAt).toEqual(expiresAt);
    });
  });

  describe("getBetterAuthSession", () => {
    it("reads the session from the request headers and maps it", async () => {
      api.getSession.mockResolvedValue({ session: { expiresAt }, user: baseUser });
      const { getBetterAuthSession } = await loadFacade();
      const session = await getBetterAuthSession();
      expect(api.getSession).toHaveBeenCalledWith({ headers: requestHeaders });
      expect(session?.user.id).toBe("u1");
    });

    it("returns null instead of throwing when Better Auth fails", async () => {
      api.getSession.mockRejectedValue(new Error("db down"));
      const { getBetterAuthSession } = await loadFacade();
      await expect(getBetterAuthSession()).resolves.toBeNull();
    });
  });

  describe("betterAuthSignIn", () => {
    it("starts the OAuth flow for a social provider and redirects to it", async () => {
      api.signInSocial.mockResolvedValue({ url: "https://github.com/login/oauth", redirect: true });
      const { betterAuthSignIn } = await loadFacade();
      await expect(betterAuthSignIn("github", { redirectTo: "/dashboard" })).rejects.toThrow(
        "NEXT_REDIRECT:https://github.com/login/oauth"
      );
      expect(api.signInSocial).toHaveBeenCalledWith({
        body: {
          provider: "github",
          callbackURL: "https://example.test/dashboard",
          disableRedirect: true,
        },
        headers: requestHeaders,
      });
    });

    it("returns the authorization URL when redirect is off", async () => {
      api.signInSocial.mockResolvedValue({ url: "https://accounts.google.com/o" });
      const { betterAuthSignIn } = await loadFacade();
      await expect(betterAuthSignIn("google", { redirect: false })).resolves.toEqual({
        ok: true,
        url: "https://accounts.google.com/o",
      });
      expect(redirect).not.toHaveBeenCalled();
    });

    it("signs in with email and password for the credentials provider", async () => {
      api.signInEmail.mockResolvedValue({ token: "t", user: baseUser });
      const { betterAuthSignIn } = await loadFacade();
      const result = await betterAuthSignIn("credentials", {
        email: "a@example.test",
        password: "pw",
        redirect: false,
        callbackUrl: "/app",
      });
      expect(result).toEqual({ ok: true, url: "/app" });
      expect(api.signInEmail).toHaveBeenCalledWith({
        body: { email: "a@example.test", password: "pw", callbackURL: "https://example.test/app" },
        headers: requestHeaders,
      });
    });

    it("reports a bad password with the message the forms already understand", async () => {
      api.signInEmail.mockRejectedValue(new FakeAPIError(401, "Invalid email or password"));
      const { betterAuthSignIn } = await loadFacade();
      const { STATUS_CODES } = await import("@/config/status-codes");
      await expect(
        betterAuthSignIn("credentials", { email: "a@example.test", password: "x", redirect: false })
      ).resolves.toEqual({ ok: false, error: STATUS_CODES.CREDENTIALS.message });
    });
  });

  describe("betterAuthSignOut", () => {
    it("revokes the session and redirects home", async () => {
      api.signOut.mockResolvedValue({ success: true });
      const { betterAuthSignOut } = await loadFacade();
      await expect(betterAuthSignOut()).rejects.toThrow(/^NEXT_REDIRECT:/);
      expect(api.signOut).toHaveBeenCalledWith({ headers: requestHeaders });
    });

    it("still redirects when there was no session to revoke", async () => {
      api.signOut.mockRejectedValue(new FakeAPIError(400, "no session"));
      const { betterAuthSignOut } = await loadFacade();
      await expect(betterAuthSignOut({ redirectTo: "/bye" })).rejects.toThrow("NEXT_REDIRECT:/bye");
    });
  });

  describe("betterAuthCredentials", () => {
    it("signs up with the email as the initial name", async () => {
      api.signUpEmail.mockResolvedValue({
        token: "t",
        user: { ...baseUser, name: baseUser.email },
      });
      const { betterAuthCredentials } = await loadFacade();
      const result = await betterAuthCredentials.signUp({
        email: "a@example.test",
        password: "pw",
      });
      expect(result).toEqual({
        ok: true,
        user: { id: "u1", email: "a@example.test", name: "a@example.test" },
      });
      expect(api.signUpEmail).toHaveBeenCalledWith({
        body: { email: "a@example.test", password: "pw", name: "a@example.test" },
        headers: requestHeaders,
      });
    });

    it("surfaces a duplicate email as an error result, not a throw", async () => {
      api.signUpEmail.mockRejectedValue(new FakeAPIError(422, "User already exists"));
      const { betterAuthCredentials } = await loadFacade();
      await expect(
        betterAuthCredentials.signUp({ email: "a@example.test", password: "pw" })
      ).resolves.toEqual({ ok: false, error: "User already exists" });
    });

    it("sends the reset link back to the app's reset page", async () => {
      api.requestPasswordReset.mockResolvedValue({ status: true });
      const { betterAuthCredentials } = await loadFacade();
      await betterAuthCredentials.forgotPassword("a@example.test");
      expect(api.requestPasswordReset).toHaveBeenCalledWith({
        body: { email: "a@example.test", redirectTo: "https://example.test/reset-password" },
        headers: requestHeaders,
      });
    });

    it("resets the password with the token from the link", async () => {
      api.resetPassword.mockResolvedValue({ status: true });
      const { betterAuthCredentials } = await loadFacade();
      await expect(betterAuthCredentials.resetPassword("tok", "new-pw")).resolves.toEqual({
        ok: true,
      });
      expect(api.resetPassword).toHaveBeenCalledWith({
        body: { token: "tok", newPassword: "new-pw" },
        headers: requestHeaders,
      });
    });
  });
});

// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The facade turns Clerk's `auth()` + `currentUser()` into the Auth.js
 * `Session` the rest of the app reads through `auth()` from `@/server/auth`,
 * and gives `signIn` / `signOut` their Auth.js semantics on top of Clerk.
 */

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

const clerk = {
  auth: vi.fn(),
  currentUser: vi.fn(),
  revokeSession: vi.fn(),
};

const loadFacade = async () => {
  vi.resetModules();
  vi.doMock("@clerk/nextjs/server", () => ({
    auth: clerk.auth,
    currentUser: clerk.currentUser,
    clerkClient: vi.fn(async () => ({ sessions: { revokeSession: clerk.revokeSession } })),
  }));
  vi.doMock("next/navigation", () => ({ redirect }));
  vi.doMock("@/lib/logger", () => ({
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }));
  return await import("@/server/clerk/facade");
};

const user = {
  id: "user_1",
  primaryEmailAddress: { emailAddress: "ada@example.test", verification: { status: "verified" } },
  fullName: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  imageUrl: "https://img.clerk.com/ada",
  publicMetadata: { role: "admin" },
  createdAt: Date.UTC(2026, 0, 2),
  updatedAt: Date.UTC(2026, 0, 3),
};

describe("clerk facade", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@clerk/nextjs/server");
    vi.doUnmock("next/navigation");
    vi.doUnmock("@/lib/logger");
    for (const fn of Object.values(clerk)) fn.mockReset();
    redirect.mockClear();
  });

  describe("getClerkSession", () => {
    it("returns null when signed out and never asks for the user", async () => {
      clerk.auth.mockResolvedValue({ userId: null, sessionClaims: null });
      const { getClerkSession } = await loadFacade();
      expect(await getClerkSession()).toBeNull();
      expect(clerk.currentUser).not.toHaveBeenCalled();
    });

    it("maps the signed-in user and the exp claim into the app's session", async () => {
      clerk.auth.mockResolvedValue({ userId: "user_1", sessionClaims: { exp: 1893456000 } });
      clerk.currentUser.mockResolvedValue(user);
      const { getClerkSession } = await loadFacade();
      const session = await getClerkSession();
      expect(session).toEqual({
        expires: new Date(1893456000 * 1000).toISOString(),
        user: expect.objectContaining({
          id: "user_1",
          email: "ada@example.test",
          name: "Ada Lovelace",
          role: "admin",
          isAdmin: true,
        }),
      });
    });

    it("returns null instead of throwing when Clerk cannot be reached", async () => {
      clerk.auth.mockRejectedValue(new Error("clerkMiddleware() was not run"));
      const { getClerkSession } = await loadFacade();
      expect(await getClerkSession()).toBeNull();
    });
  });

  describe("clerkSignInUrl", () => {
    it("carries a same-origin next path and drops anything else", async () => {
      const { clerkSignInUrl } = await loadFacade();
      expect(clerkSignInUrl("/app?tab=1")).toBe("/sign-in?next=%2Fapp%3Ftab%3D1");
      expect(clerkSignInUrl("https://evil.test/")).toBe("/sign-in");
      expect(clerkSignInUrl("//evil.test/")).toBe("/sign-in");
      expect(clerkSignInUrl()).toBe("/sign-in");
      expect(clerkSignInUrl("/app", "signUp")).toBe("/sign-up?next=%2Fapp");
    });
  });

  describe("clerkSignIn", () => {
    it("redirects to the sign-in route with the callback as next", async () => {
      const { clerkSignIn } = await loadFacade();
      await expect(clerkSignIn("github", { redirectTo: "/after" })).rejects.toThrow(
        "NEXT_REDIRECT:/sign-in?next=%2Fafter"
      );
    });

    it("defaults next to the dashboard and reads FormData too", async () => {
      const { clerkSignIn } = await loadFacade();
      await expect(clerkSignIn()).rejects.toThrow("NEXT_REDIRECT:/sign-in?next=%2Fdashboard");
      const form = new FormData();
      form.set("callbackUrl", "/settings");
      await expect(clerkSignIn(undefined, form)).rejects.toThrow(
        "NEXT_REDIRECT:/sign-in?next=%2Fsettings"
      );
    });

    it("returns the URL instead when redirect is off", async () => {
      const { clerkSignIn } = await loadFacade();
      const result = await clerkSignIn("google", { redirectTo: "/x", redirect: false });
      expect(result).toEqual({ ok: true, url: "/sign-in?next=%2Fx" });
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("clerkSignOut", () => {
    it("revokes the current session and redirects home", async () => {
      clerk.auth.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
      const { clerkSignOut } = await loadFacade();
      await expect(clerkSignOut()).rejects.toThrow("NEXT_REDIRECT:/");
      expect(clerk.revokeSession).toHaveBeenCalledWith("sess_1");
    });

    it("still redirects when there is no session to revoke", async () => {
      clerk.auth.mockResolvedValue({ userId: null, sessionId: null });
      const { clerkSignOut } = await loadFacade();
      await expect(clerkSignOut({ redirectTo: "/bye" })).rejects.toThrow("NEXT_REDIRECT:/bye");
      expect(clerk.revokeSession).not.toHaveBeenCalled();
    });

    it("swallows a revoke failure and refuses an off-site redirect", async () => {
      clerk.auth.mockResolvedValue({ userId: "user_1", sessionId: "sess_1" });
      clerk.revokeSession.mockRejectedValue(new Error("already revoked"));
      const { clerkSignOut } = await loadFacade();
      const result = await clerkSignOut({ redirectTo: "https://evil.test", redirect: false });
      expect(result).toEqual({ url: "/" });
      expect(redirect).not.toHaveBeenCalled();
    });
  });
});

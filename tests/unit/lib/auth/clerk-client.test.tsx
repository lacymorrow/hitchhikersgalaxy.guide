import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Under Clerk, `useSession`, `signIn` and `signOut` from
 * `@/lib/auth/use-session` come from `@/lib/auth/clerk-client`: Clerk's
 * `useUser()` / `useSession()` are mapped into the `next-auth/react` shape,
 * sign-in navigates to the app's sign-in route (which the proxy forwards to
 * Clerk's hosted page) and sign-out ends the Clerk session.
 */

const clerkHooks = {
  useUser: vi.fn(),
  useSession: vi.fn(),
};

const nextAuth = { useSession: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
const betterAuthClient = {
  useSession: vi.fn(),
  getSession: vi.fn(),
  signIn: { social: vi.fn(), email: vi.fn() },
  signOut: vi.fn(),
};

const load = async () => {
  vi.resetModules();
  vi.doMock("@/env", () => ({
    env: {
      NEXT_PUBLIC_AUTH_STRATEGY: "clerk",
      NEXT_PUBLIC_FEATURE_AUTH_CLERK_ENABLED: true,
      NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
    },
  }));
  vi.doMock("@clerk/nextjs", () => clerkHooks);
  vi.doMock("next-auth/react", () => nextAuth);
  vi.doMock("@/lib/better-auth/client", () => ({ authClient: betterAuthClient }));
  return await import("@/lib/auth/use-session");
};

const reload = vi.fn(async () => {});
const user = {
  id: "user_1",
  primaryEmailAddress: { emailAddress: "ada@example.test", verification: { status: "verified" } },
  fullName: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  imageUrl: "https://img.clerk.com/ada",
  publicMetadata: { role: "admin" },
  createdAt: new Date("2026-01-02T00:00:00.000Z"),
  updatedAt: new Date("2026-01-03T00:00:00.000Z"),
  reload,
};
const expireAt = new Date("2030-01-02T03:04:05.000Z");

const stubLocation = () => {
  const location = { href: "http://localhost/app?tab=1", origin: "http://localhost" };
  Object.defineProperty(window, "location", {
    value: location,
    writable: true,
    configurable: true,
  });
  return location;
};

describe("useSession under Clerk", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
    vi.doUnmock("@clerk/nextjs");
    vi.doUnmock("next-auth/react");
    vi.doUnmock("@/lib/better-auth/client");
    clerkHooks.useUser.mockReset();
    clerkHooks.useSession.mockReset();
    reload.mockClear();
  });

  it("maps the Clerk user and session expiry into the next-auth shape", async () => {
    clerkHooks.useUser.mockReturnValue({ isLoaded: true, isSignedIn: true, user });
    clerkHooks.useSession.mockReturnValue({ isLoaded: true, session: { expireAt } });
    const { useSession } = await load();
    const { result } = renderHook(() => useSession());
    expect(result.current.status).toBe("authenticated");
    expect(result.current.data).toEqual({
      expires: "2030-01-02T03:04:05.000Z",
      user: expect.objectContaining({
        id: "user_1",
        email: "ada@example.test",
        name: "Ada Lovelace",
        role: "admin",
        isAdmin: true,
      }),
    });
    expect(nextAuth.useSession).not.toHaveBeenCalled();
    expect(betterAuthClient.useSession).not.toHaveBeenCalled();
  });

  it("reports loading until Clerk has loaded, then unauthenticated", async () => {
    clerkHooks.useUser.mockReturnValue({ isLoaded: false, isSignedIn: undefined, user: undefined });
    clerkHooks.useSession.mockReturnValue({ isLoaded: false, session: undefined });
    const { useSession } = await load();
    const { result, rerender } = renderHook(() => useSession());
    expect(result.current).toMatchObject({ data: null, status: "loading" });

    clerkHooks.useUser.mockReturnValue({ isLoaded: true, isSignedIn: false, user: null });
    clerkHooks.useSession.mockReturnValue({ isLoaded: true, session: null });
    rerender();
    expect(result.current).toMatchObject({ data: null, status: "unauthenticated" });
  });

  it("update() reloads the Clerk user and returns the mapped session", async () => {
    clerkHooks.useUser.mockReturnValue({ isLoaded: true, isSignedIn: true, user });
    clerkHooks.useSession.mockReturnValue({ isLoaded: true, session: { expireAt } });
    const { useSession } = await load();
    const { result } = renderHook(() => useSession());
    const fresh = await result.current.update();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(fresh?.user.id).toBe("user_1");
  });

  it("sends a required, signed-out visitor to the sign-in route with next", async () => {
    const location = stubLocation();
    clerkHooks.useUser.mockReturnValue({ isLoaded: true, isSignedIn: false, user: null });
    clerkHooks.useSession.mockReturnValue({ isLoaded: true, session: null });
    const { useSession } = await load();
    renderHook(() => useSession({ required: true }));
    expect(location.href).toBe("/sign-in?next=%2Fapp%3Ftab%3D1");
  });
});

describe("signIn and signOut under Clerk", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
    vi.doUnmock("@clerk/nextjs");
    vi.doUnmock("next-auth/react");
    vi.doUnmock("@/lib/better-auth/client");
    nextAuth.signIn.mockReset();
    nextAuth.signOut.mockReset();
    (window as Window & { Clerk?: unknown }).Clerk = undefined;
  });

  it("navigates to the sign-in route with the callback as next, whatever the provider", async () => {
    const location = stubLocation();
    const { signIn } = await load();
    await signIn("guest", { callbackUrl: "/after" });
    expect(location.href).toBe("/sign-in?next=%2Fafter");
    expect(nextAuth.signIn).not.toHaveBeenCalled();
    expect(betterAuthClient.signIn.social).not.toHaveBeenCalled();
  });

  it("defaults next to the current page and returns the next-auth shape when redirect is off", async () => {
    stubLocation();
    const { signIn } = await load();
    const result = await signIn("github", { redirect: false });
    expect(result).toEqual({
      ok: true,
      error: undefined,
      code: undefined,
      status: 200,
      url: "/sign-in?next=%2Fapp%3Ftab%3D1",
    });
  });

  it("drops an off-site callback rather than forwarding it", async () => {
    stubLocation();
    const { signIn } = await load();
    const result = await signIn(undefined, { callbackUrl: "https://evil.test/x", redirect: false });
    expect(result).toMatchObject({ url: "/sign-in" });
  });

  it("ends the Clerk session through the Clerk global, then navigates", async () => {
    const location = stubLocation();
    const clerkSignOut = vi.fn(async () => {});
    (window as Window & { Clerk?: unknown }).Clerk = { signOut: clerkSignOut };
    const { signOut } = await load();
    const result = await signOut({ callbackUrl: "/bye" });
    expect(clerkSignOut).toHaveBeenCalledTimes(1);
    expect(location.href).toBe("/bye");
    expect(result).toEqual({ url: "/bye" });
    expect(nextAuth.signOut).not.toHaveBeenCalled();
  });

  it("still resolves when Clerk has not loaded yet", async () => {
    const location = stubLocation();
    const { signOut } = await load();
    await signOut();
    expect(location.href).toBe("/");
  });
});

import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Components import `useSession`, `signIn` and `signOut` from
 * `@/lib/auth/use-session` and expect the `next-auth/react` shapes. Under
 * Auth.js the originals are returned; under Better Auth the client hook's
 * `{ data: { user, session }, isPending }` is mapped into
 * `{ data: { user, expires } | null, status, update }`.
 */

const nextAuth = {
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
};

const refetch = vi.fn(async () => {});
const betterAuthClient = {
  useSession: vi.fn(),
  getSession: vi.fn(),
  signIn: { social: vi.fn(), email: vi.fn() },
  signOut: vi.fn(),
};

const load = async (strategy: "better-auth" | "authjs") => {
  vi.resetModules();
  vi.doMock("@/env", () => ({
    env: {
      NEXT_PUBLIC_AUTH_STRATEGY: strategy,
      NEXT_PUBLIC_FEATURE_BETTER_AUTH_ENABLED: true,
      NEXT_PUBLIC_FEATURE_AUTH_GITHUB_ENABLED: true,
    },
  }));
  vi.doMock("next-auth/react", () => nextAuth);
  vi.doMock("@/lib/better-auth/client", () => ({ authClient: betterAuthClient }));
  return await import("@/lib/auth/use-session");
};

const expiresAt = "2030-01-02T03:04:05.000Z";
const user = {
  id: "u1",
  email: "a@example.test",
  name: "Ada",
  image: null,
  emailVerified: true,
  emailVerifiedAt: "2026-05-06T07:08:09.000Z",
  role: "admin",
};

describe("useSession", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
    vi.doUnmock("next-auth/react");
    vi.doUnmock("@/lib/better-auth/client");
    for (const fn of Object.values(nextAuth)) fn.mockReset();
    betterAuthClient.useSession.mockReset();
    betterAuthClient.getSession.mockReset();
    betterAuthClient.signIn.social.mockReset();
    betterAuthClient.signIn.email.mockReset();
    betterAuthClient.signOut.mockReset();
    refetch.mockClear();
  });

  it("is the next-auth/react hook under Auth.js", async () => {
    const value = { data: null, status: "unauthenticated", update: vi.fn() };
    nextAuth.useSession.mockReturnValue(value);
    const { useSession } = await load("authjs");
    const { result } = renderHook(() => useSession());
    expect(result.current).toBe(value);
    expect(betterAuthClient.useSession).not.toHaveBeenCalled();
  });

  it("maps a Better Auth session into the next-auth shape", async () => {
    betterAuthClient.useSession.mockReturnValue({
      data: { user, session: { expiresAt } },
      isPending: false,
      refetch,
    });
    const { useSession } = await load("better-auth");
    const { result } = renderHook(() => useSession());
    expect(result.current.status).toBe("authenticated");
    expect(result.current.data).toEqual({
      expires: expiresAt,
      user: expect.objectContaining({
        id: "u1",
        email: "a@example.test",
        name: "Ada",
        role: "admin",
        isAdmin: true,
        emailVerified: new Date("2026-05-06T07:08:09.000Z"),
      }),
    });
    expect(nextAuth.useSession).not.toHaveBeenCalled();
  });

  it("reports loading while Better Auth is still fetching", async () => {
    betterAuthClient.useSession.mockReturnValue({ data: null, isPending: true, refetch });
    const { useSession } = await load("better-auth");
    const { result } = renderHook(() => useSession());
    expect(result.current).toMatchObject({ data: null, status: "loading" });
  });

  it("reports unauthenticated when Better Auth has no session", async () => {
    betterAuthClient.useSession.mockReturnValue({ data: null, isPending: false, refetch });
    const { useSession } = await load("better-auth");
    const { result } = renderHook(() => useSession());
    expect(result.current).toMatchObject({ data: null, status: "unauthenticated" });
  });

  it("update() refetches and returns the fresh mapped session", async () => {
    betterAuthClient.useSession.mockReturnValue({ data: null, isPending: false, refetch });
    betterAuthClient.getSession.mockResolvedValue({
      data: { user, session: { expiresAt } },
      error: null,
    });
    const { useSession } = await load("better-auth");
    const { result } = renderHook(() => useSession());
    const fresh = await result.current.update({ force: true });
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(fresh?.user.id).toBe("u1");
    expect(fresh?.expires).toBe(expiresAt);
  });
});

describe("signIn and signOut", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/env");
    vi.doUnmock("next-auth/react");
    vi.doUnmock("@/lib/better-auth/client");
    for (const fn of Object.values(nextAuth)) fn.mockReset();
    betterAuthClient.signIn.social.mockReset();
    betterAuthClient.signIn.email.mockReset();
    betterAuthClient.signOut.mockReset();
  });

  it("delegates to next-auth/react under Auth.js", async () => {
    nextAuth.signIn.mockResolvedValue(undefined);
    nextAuth.signOut.mockResolvedValue(undefined);
    const { signIn, signOut } = await load("authjs");
    await signIn("github", { callbackUrl: "/x" });
    await signOut({ callbackUrl: "/" });
    expect(nextAuth.signIn).toHaveBeenCalledWith("github", { callbackUrl: "/x" }, undefined);
    expect(nextAuth.signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("starts the Better Auth social flow with the callback URL", async () => {
    betterAuthClient.signIn.social.mockResolvedValue({ data: { url: "https://gh" }, error: null });
    const { signIn } = await load("better-auth");
    await signIn("github", { callbackUrl: "/after", redirect: true });
    expect(betterAuthClient.signIn.social).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/after",
      disableRedirect: false,
    });
    expect(nextAuth.signIn).not.toHaveBeenCalled();
  });

  it("returns the next-auth response shape when redirect is off", async () => {
    betterAuthClient.signIn.social.mockResolvedValue({ data: { url: "https://gh" }, error: null });
    const { signIn } = await load("better-auth");
    const result = await signIn("github", { redirectTo: "/after", redirect: false });
    expect(result).toEqual({
      ok: true,
      error: undefined,
      code: undefined,
      status: 200,
      url: "https://gh",
    });
  });

  it("signs in with email and password for the credentials provider", async () => {
    betterAuthClient.signIn.email.mockResolvedValue({
      data: null,
      error: {
        message: "Invalid email or password",
        code: "INVALID_EMAIL_OR_PASSWORD",
        status: 401,
      },
    });
    const { signIn } = await load("better-auth");
    const result = await signIn("credentials", {
      email: "a@example.test",
      password: "x",
      redirect: false,
      callbackUrl: "/app",
    });
    expect(betterAuthClient.signIn.email).toHaveBeenCalledWith({
      email: "a@example.test",
      password: "x",
      callbackURL: "/app",
    });
    expect(result).toMatchObject({ ok: false, error: "Invalid email or password", status: 401 });
  });

  it("leaves Auth.js-only providers such as guest with next-auth", async () => {
    nextAuth.signIn.mockResolvedValue({ ok: true });
    const { signIn } = await load("better-auth");
    await signIn("guest", { name: "Visitor", redirect: false });
    expect(nextAuth.signIn).toHaveBeenCalledTimes(1);
    expect(betterAuthClient.signIn.social).not.toHaveBeenCalled();
  });

  it("revokes the Better Auth session and reports where to go next", async () => {
    betterAuthClient.signOut.mockResolvedValue({ data: { success: true }, error: null });
    const { signOut } = await load("better-auth");
    const result = await signOut({ callbackUrl: "/bye", redirect: false });
    expect(betterAuthClient.signOut).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ url: "/bye" });
    expect(nextAuth.signOut).not.toHaveBeenCalled();
  });
});

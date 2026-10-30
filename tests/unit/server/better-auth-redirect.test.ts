/**
 * The Better Auth facade is where a caller-supplied redirect target actually
 * reaches next/navigation redirect(). The sign-in form guards its own value,
 * but server actions are public POST endpoints, so this is the check that has
 * to hold.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BASE_URL } from "@/config/base-url";
import { routes } from "@/config/routes";

const redirect = vi.fn();
const signInEmail = vi.fn(async () => ({}));
const signInSocial = vi.fn(async () => ({ url: "https://provider.example/authorize" }));
const signOut = vi.fn(async () => ({}));

vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/server/better-auth/config", () => ({
  auth: { api: { signInEmail, signInSocial, signOut } },
}));

/** What every rejected value has to collapse to. */
const HOME_URL = new URL(routes.home, BASE_URL).toString();

const OFF_ORIGIN = [
  "https://evil.example/phish",
  "//evil.example",
  "/\\evil.example",
  "/..//evil.example",
  "javascript:alert(1)",
];

describe("betterAuthSignIn redirect target", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(OFF_ORIGIN)("sends %s to the home route instead", async (redirectTo) => {
    const { betterAuthSignIn } = await import("@/server/better-auth/facade");
    await betterAuthSignIn("credentials", {
      email: "a@b.test",
      password: "pass",
      redirect: true,
      redirectTo,
    });

    expect(redirect).toHaveBeenCalledWith(routes.home);
    // The same value also becomes the provider callbackURL.
    expect(signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ callbackURL: HOME_URL }) })
    );
  });

  it("keeps a same-origin path", async () => {
    const { betterAuthSignIn } = await import("@/server/better-auth/facade");
    await betterAuthSignIn("credentials", {
      email: "a@b.test",
      password: "pass",
      redirect: true,
      redirectTo: "/guide/towel?from=search",
    });

    expect(redirect).toHaveBeenCalledWith("/guide/towel?from=search");
  });

  it("falls back for an off-origin callbackUrl alias", async () => {
    const { betterAuthSignIn } = await import("@/server/better-auth/facade");
    const result = await betterAuthSignIn("credentials", {
      email: "a@b.test",
      password: "pass",
      redirect: false,
      callbackUrl: "https://evil.example",
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, url: routes.home });
  });

  it("keeps an off-origin value out of the OAuth callbackURL", async () => {
    const { betterAuthSignIn } = await import("@/server/better-auth/facade");
    await betterAuthSignIn("google", { redirect: false, redirectTo: "https://evil.example" });

    expect(signInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.objectContaining({ callbackURL: HOME_URL }) })
    );
  });
});

describe("betterAuthSignOut redirect target", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(OFF_ORIGIN)("sends %s to the home route instead", async (redirectTo) => {
    const { betterAuthSignOut } = await import("@/server/better-auth/facade");
    await betterAuthSignOut({ redirectTo });

    expect(redirect).toHaveBeenCalledWith(routes.home);
  });

  it("keeps the status-code query the sign-out default carries", async () => {
    const { betterAuthSignOut } = await import("@/server/better-auth/facade");
    await betterAuthSignOut({ redirectTo: "/?code=LOGOUT" });

    expect(redirect).toHaveBeenCalledWith("/?code=LOGOUT");
  });
});

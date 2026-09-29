import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The client wraps better-auth/react. A minor bump that renames a method on the
 * returned client would break sign-in at runtime with nothing else catching it,
 * so assert the shape the app destructures and the calls the helpers make.
 */

const createAuthClient = vi.fn();

const loadClient = async () => {
  vi.resetModules();
  const social = vi.fn();
  const email = vi.fn();
  const signUpEmail = vi.fn();
  const client = {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signIn: { social, email },
    signUp: { email: signUpEmail },
    signOut: vi.fn(),
    getSession: vi.fn(),
  };
  createAuthClient.mockReturnValue(client);
  vi.doMock("better-auth/react", () => ({ createAuthClient }));
  vi.doMock("@/config/base-url", () => ({ BASE_URL: "https://example.test" }));
  const mod = await import("@/lib/better-auth/client");
  return { mod, client, social, email, signUpEmail };
};

describe("better auth client", () => {
  afterEach(() => {
    vi.resetModules();
    createAuthClient.mockReset();
    vi.doUnmock("better-auth/react");
    vi.doUnmock("@/config/base-url");
  });

  it("builds the client against the site base URL and the server's base path", async () => {
    await loadClient();
    expect(createAuthClient).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "https://example.test", basePath: "/api/better-auth" })
    );
  });

  it("re-exports the hooks and methods the app destructures", async () => {
    const { mod } = await loadClient();
    for (const name of ["useSession", "signIn", "signUp", "signOut", "getSession"] as const) {
      expect(mod[name], `missing export: ${name}`).toBeDefined();
    }
  });

  it("routes each social helper to its provider", async () => {
    const { mod, social } = await loadClient();
    mod.socialSignIn.google();
    mod.socialSignIn.github();
    mod.socialSignIn.discord();
    expect(social.mock.calls.map(([arg]) => arg.provider)).toEqual(["google", "github", "discord"]);
  });

  it("passes credentials straight through to the email helpers", async () => {
    const { mod, email, signUpEmail } = await loadClient();
    mod.emailAuth.signIn("a@example.test", "pw");
    expect(email).toHaveBeenCalledWith({ email: "a@example.test", password: "pw" });

    mod.emailAuth.signUp("b@example.test", "pw2", "Bee");
    expect(signUpEmail).toHaveBeenCalledWith({
      email: "b@example.test",
      password: "pw2",
      name: "Bee",
    });
  });

  it("warns rather than throwing when the client reports a rate limit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await loadClient();
    const options = createAuthClient.mock.calls[0]?.[0];
    options.fetchOptions.onError({ error: { status: 429 } });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

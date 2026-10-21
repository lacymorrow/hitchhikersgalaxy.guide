import { describe, expect, it } from "vitest";
import { getSafeNextUrl } from "@/lib/utils/safe-next-url";

describe("getSafeNextUrl", () => {
  it("keeps a same-origin path", () => {
    expect(getSafeNextUrl("/dashboard")).toBe("/dashboard");
    expect(getSafeNextUrl("/guide/towel?from=search")).toBe("/guide/towel?from=search");
    expect(getSafeNextUrl("/guide/towel#entry")).toBe("/guide/towel#entry");
  });

  it("rejects an absolute URL", () => {
    expect(getSafeNextUrl("https://evil.example/phish")).toBeNull();
    expect(getSafeNextUrl("http://evil.example")).toBeNull();
  });

  it("rejects protocol-relative forms that leave the site", () => {
    // The sign-in form hands this value to an action that redirects to it
    // without checking the origin, and a browser reads "//host" as absolute.
    expect(getSafeNextUrl("//evil.example")).toBeNull();
    expect(getSafeNextUrl("/\\evil.example")).toBeNull();
    expect(getSafeNextUrl("/\\\\evil.example")).toBeNull();
  });

  it("rejects characters the URL parser strips before parsing", () => {
    // Tab, LF and CR are removed by the URL parser, so each of these is
    // "//evil.example" by the time a browser resolves it.
    expect(getSafeNextUrl("/\t/evil.example")).toBeNull();
    expect(getSafeNextUrl("/\n/evil.example")).toBeNull();
    expect(getSafeNextUrl("/\r/evil.example")).toBeNull();
    expect(getSafeNextUrl("/\t\\evil.example")).toBeNull();
    expect(getSafeNextUrl("/\r\n/evil.example")).toBeNull();
    expect(getSafeNextUrl("/\u0000/evil.example")).toBeNull();
  });

  it("rejects a path that normalizes into a protocol-relative form", () => {
    // These resolve to the probe origin, so the origin compare passes, but
    // the normalized pathname is "//evil.example". The result is checked too.
    expect(getSafeNextUrl("/..//evil.example")).toBeNull();
    expect(getSafeNextUrl("/a/..//evil.example")).toBeNull();
    expect(getSafeNextUrl("/../..//evil.example")).toBeNull();
  });

  it("keeps a traversal that stays on a real path", () => {
    expect(getSafeNextUrl("/a/../dashboard")).toBe("/dashboard");
    expect(getSafeNextUrl("/../dashboard")).toBe("/dashboard");
  });

  it("rejects a missing or relative-looking value", () => {
    expect(getSafeNextUrl(null)).toBeNull();
    expect(getSafeNextUrl(undefined)).toBeNull();
    expect(getSafeNextUrl("")).toBeNull();
    expect(getSafeNextUrl("dashboard")).toBeNull();
    expect(getSafeNextUrl("javascript:alert(1)")).toBeNull();
  });
});

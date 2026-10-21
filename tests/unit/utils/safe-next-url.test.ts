import { describe, expect, it } from "vitest";
import { getSafeNextUrl } from "@/lib/utils/safe-next-url";

describe("getSafeNextUrl", () => {
	it("keeps a same-origin path", () => {
		expect(getSafeNextUrl("/dashboard")).toBe("/dashboard");
		expect(getSafeNextUrl("/guide/towel?from=search")).toBe("/guide/towel?from=search");
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
	});

	it("rejects a missing or relative-looking value", () => {
		expect(getSafeNextUrl(null)).toBeNull();
		expect(getSafeNextUrl(undefined)).toBeNull();
		expect(getSafeNextUrl("")).toBeNull();
		expect(getSafeNextUrl("dashboard")).toBeNull();
		expect(getSafeNextUrl("javascript:alert(1)")).toBeNull();
	});
});

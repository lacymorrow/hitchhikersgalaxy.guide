import { describe, expect, it } from "vitest";
import { checkGuideTerm, checkRawShape, checkSubmissionText } from "@/lib/guide-gate";

// Real rows deleted from production guide_entry in the 2026-10-19 audit
// (LAC-4156), as stored (normalized), plus the raw URLs that produced them.
const AUDIT_JUNK_STORED = [
	"humanstxt",
	"adstxt",
	"securitytxt",
	"llmstxt",
	"llms-fulltxt",
	"aitxt",
	"error-7ea4c04ddb383cf5js",
	"page-0986caa41f98c539js",
	"layout 964d13eaeef5cb86js",
	"mainjs",
	"apple-touch-iconpng",
	"apple touch icon 152x152 precomposedpng",
	"apple-iconpngc38668d7ba3525c0",
	"iconpng531845625261c099",
	"faviconpng",
	"faviconico8212aa73f5e80ab1",
	"magento_version",
	"_fragment",
	"alfa_data",
	"alfacgiapi",
	"well-known",
	"well-knownold",
	"ds_store",
	"loginaction",
	"_all_dbs",
	"server-status",
	"settingspy",
	"settingsproperties",
	"applicationproperties",
	"dumpsql",
	"databasesql",
	"dbsql",
	"serverkey",
	"_profiler",
	"ftpsyncsettings",
	"indexhtml",
	"swagger-uihtml",
	"telerikwebuiwebresourceaxd",
	"hitchhikersgalaxyzip",
	"archivezip",
	"walletdat",
	"walletdatbkp",
	"cgi-bin",
	"oldsite",
	"vendor",
	"uploads",
	"plugins",
	"components",
	"include",
	"graphql",
	"c2paaction",
	"enhancecp",
	"phpinfo",
	"phpinfophporig",
	"php_infophptmp",
	"testphpsave",
	"infophpback",
	"phpdebugbar",
	"clients registrations",
	"test",
	"temp",
	"testhello",
	"this-should-fail",
	"this should fail",
	"does-not-exist",
	"nope-zz-404",
];

const RAW_PROBES = [
	"humans.txt",
	"settings.py",
	".env",
	".env.production",
	".git/config",
	"phpinfo.php.old",
	"wp-login.php",
	"apple-touch-icon-152x152.png",
	"_next/static/chunks/main.js",
	"..%2f..%2fetc%2fpasswd",
	"%252e%252e",
	"<script>alert(1)</script>",
	"' or 1=1 --",
	"1 union select password from users",
	"javascript:alert(1)",
	"view-source:https://example.com",
	// biome-ignore lint/suspicious/noTemplateCurlyInString: literal Log4Shell probe
	"${jndi:ldap://x}",
	"PD9waHAgc3lzdGVtKCRfR0VUWydjJ10pOyA/Pg==",
	"aGVsbG8gd29ybGQgdGhpcyBpcyBhIHRlc3Q",
];

// Real kept entries and new topics a visitor might ask about. These must
// still generate.
const LEGIT = [
	"babel fish",
	"zaphod beeblebrox",
	"42",
	"ai",
	"dont panic",
	"vogon poetry",
	"pan galactic gargle blaster",
	"elephant",
	"sandwich",
	"travis touchdown",
	"no more heroes game",
	"3 body problem",
	"huntshowdown 1896",
	"how do i time travel",
	"mattresses near me",
	"kick-ass comic character",
	"don't panic!",
	"Dr. Who",
	"AC/DC",
	"rhythm",
	"supercalifragilisticexpialidocious",
	"lgbtq",
	"wasp",
	"grasp",
	"mexico",
	"html",
	"learn html",
	"big data: a primer",
	"batman: arkham",
	"server",
	"main",
	"query",
	"thai food",
	"skibidi toilet",
];

describe("checkGuideTerm", () => {
	it("rejects every junk term from the production audit", () => {
		for (const term of AUDIT_JUNK_STORED) {
			expect(checkGuideTerm(term).ok, term).toBe(false);
		}
	});

	it("rejects raw probe and payload shapes", () => {
		for (const term of RAW_PROBES) {
			expect(checkGuideTerm(term).ok, term).toBe(false);
		}
	});

	it("allows real topics, in any capitalization or punctuation", () => {
		for (const term of LEGIT) {
			const result = checkGuideTerm(term);
			expect(result.ok, `${term}: ${result.ok ? "" : result.reason}`).toBe(true);
		}
	});

	it("returns the normalized term", () => {
		expect(checkGuideTerm("  Babel   Fish ")).toEqual({ ok: true, term: "babel fish" });
	});

	it("caps length and word count", () => {
		expect(checkGuideTerm("a".repeat(81))).toEqual({ ok: false, reason: "too-long" });
		expect(checkGuideTerm("one two three four five six seven eight nine")).toEqual({
			ok: false,
			reason: "too-many-words",
		});
	});

	it("rejects spam and slurs", () => {
		for (const term of ["casino bonus", "viagra", "slot gacor", "kill yourself"]) {
			expect(checkGuideTerm(term).ok, term).toBe(false);
		}
	});
});

describe("checkRawShape", () => {
	it("flags dotted file names before the page's canonical redirect strips the dot", () => {
		expect(checkRawShape("settings.py")).toBe("file-or-path");
		expect(checkRawShape("main.js")).toBe("file-or-path");
		expect(checkRawShape("babel fish")).toBeNull();
		expect(checkRawShape("dr. who")).toBeNull();
	});
});

describe("checkSubmissionText", () => {
	it("rejects links, markup, and spam in submission fields", () => {
		expect(checkSubmissionText({ content: "Visit https://spam.example now" }).ok).toBe(false);
		expect(checkSubmissionText({ content: "see www.example.com" }).ok).toBe(false);
		expect(checkSubmissionText({ funFact: "<script>x</script>" }).ok).toBe(false);
		expect(checkSubmissionText({ advertisement: "Best casino odds" }).ok).toBe(false);
	});

	it("allows ordinary Guide prose", () => {
		expect(
			checkSubmissionText({
				content: "A small, yellow and leechlike fish. Probably the oddest thing in the Universe.",
				advertisement: "",
			}).ok,
		).toBe(true);
	});
});

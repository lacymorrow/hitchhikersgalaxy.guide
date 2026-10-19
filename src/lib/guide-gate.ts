/**
 * Gate in front of every new Guide entry: AI generation from an unknown slug
 * or search, and manual submissions. Pure and synchronous so it can run in
 * the page, the server actions, and unit tests alike.
 *
 * Existing entries are looked up before this runs, so tightening a rule here
 * never hides an entry that is already in the database. It only stops new
 * rows from being created.
 *
 * Rules were derived from the 2026-10-19 audit of production guide_entry
 * rows (LAC-4156): crawler file probes (`humans.txt`, `phpinfo.php.old`,
 * `apple-touch-icon-152x152.png`), Next.js chunk names with hashes,
 * framework/CMS paths (`cgi-bin`, `.well-known`, `server-status`), our own
 * test hits (`test`, `this-should-fail`), and keyboard mashes.
 */

import { isBlockedSearchTerm } from "@/lib/guide-blocklist";
import { normalizeSlug } from "@/lib/utils";

export const GUIDE_TERM_MAX_LENGTH = 80;
export const GUIDE_TERM_MAX_WORDS = 8;

export type GuideGateResult =
	| { ok: true; term: string }
	| { ok: false; reason: GuideGateReason };

export type GuideGateReason =
	| "empty"
	| "too-long"
	| "too-many-words"
	| "characters"
	| "file-or-path"
	| "encoded"
	| "injection"
	| "hash"
	| "random"
	| "reserved"
	| "spam-or-abuse"
	| "blocklist";

// Raw input: anything that only makes sense as a URL, file, or payload.
const RAW_FORBIDDEN_CHARS = /[\u0000-\u001f\u007f<>{}[\]`$\\|;=^~*]/;
const FILE_EXTENSIONS =
	"php\\d?|phtml|aspx?|axd|jsp|cgi|pl|py|rb|sh|bash|env|git|svn|hg|sql|db|sqlite\\d?|dump|bak|bkp|old|orig|save|swp|tmp|temp|txt|log|ini|conf|cfg|config|properties|xml|ya?ml|json|toml|lock|zip|tar|t?gz|rar|7z|js|mjs|cjs|map|css|s[ac]ss|html?|png|jpe?g|gif|ico|svg|webp|avif|bmp|woff2?|ttf|eot|dat|pem|key|crt|ds_store|exe|dll|bin"
const RAW_FILE_SHAPE = new RegExp(`\\.(${FILE_EXTENSIONS})(\\.|$|[^a-z0-9])`, "i");
const RAW_PATH_SHAPE =
	/^[./]|\/\/|\/$|\.\.|:\/\/|^\s*(javascript|data|vbscript|file|php|phar|view-source|https?|ftp|gopher|dict|ldap|jar|expect|glob):/i;
const RAW_ENCODED_SHAPE =
	/%[0-9a-fA-F]{2}|&#[xX]?[0-9a-fA-F]+;?|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}|(?=[A-Za-z0-9+/]*\d)(?=[A-Za-z0-9+/]*[A-Z])(?=[A-Za-z0-9+/]*[a-z])[A-Za-z0-9+/]{20,}={0,2}|[A-Za-z0-9+/]{8,}==?$/;
const RAW_INJECTION_SHAPE =
	/\b(select\b.+\bfrom|union\b.+\bselect|insert\s+into|drop\s+table|delete\s+from|update\s+\w+\s+set|or\s+1\s*=\s*1|sleep\s*\(|benchmark\s*\(|waitfor\s+delay)\b|--|\/\*|<\s*script|\bon\w+\s*=/i;

// Normalized form (lowercase, [a-z0-9 _-] only): shapes left behind after
// normalizeSlug strips the dots out of a file name.
const NORM_GLUED_FILE = new RegExp(
	[
		"[a-z0-9]{2}(php\\d?|phtml|aspx|axd|jsp|txt|png|jpe?g|gif|svg|webp|html?|json|yml|yaml|sql|zip|bkp)$",
		"php(info|old|orig|save|tmp|bak|back|txt)",
		"(application|settings?|config|database|db|dump|backup|wallet|site|web|server)\\s?(properties|py|sql|dat|bkp|php|yml|yaml|json|xml|key|conf|ini)$",
		"^favicon|^apple[ -]?(touch|icon)|^icon ?(png|ico|svg)",
		"^(ads|humans|security|robots|llms|llms-full|llms full|ai|crossdomain|browserconfig|manifest)\\s?(txt|xml|json)$",
		"debugbar|_profiler|telerik|webresource|magento|phpinfo|php_info|_all_dbs|ds_store|_fragment|ftpsync|enhancecp|c2pa",
	].join("|"),
);
// A run of 8+ hex characters mixing digits and letters: build-chunk hashes.
const NORM_HASH = /(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{8,}/;

// Framework, CMS, and server paths that only bots ask about, plus our own
// test and route names. Matched against the normalized term with hyphens
// read as spaces.
const RESERVED_TERMS = new Set([
	"test",
	"tests",
	"testing",
	"temp",
	"tmp",
	"testhello",
	"hello test",
	"this should fail",
	"should fail",
	"does not exist",
	"not found",
	"404",
	"500",
	"undefined",
	"null",
	"nan",
	"none",
	"asdf",
	"asdfgh",
	"qwerty",
	"foo",
	"bar",
	"foobar",
	"lorem ipsum",
	"assets",
	"static",
	"vendor",
	"plugins",
	"modules",
	"components",
	"include",
	"includes",
	"uploads",
	"upload",
	"oldsite",
	"newsite",
	"old site",
	"new site",
	"cgi bin",
	"cgi",
	"well known",
	"wellknown",
	"well knownold",
	"server status",
	"server info",
	"serverkey",
	"server key",
	"graphql",
	"graphiql",
	"swagger",
	"swagger ui",
	"actuator",
	"telescope",
	"administrator",
	"loginaction",
	"login action",
	"clients registrations",
	"client registrations",
	"wallet",
	"walletdat",
]);
const RESERVED_SHAPE = /^test ?(hello|page|site|file|entry|\d+)$|^(tmp|temp) ?\d+$|^nope\b|\bshould fail\b|\bdoes not exist\b|^wp\b/;

// Spam, ads, and abuse. Deliberately short: generated entries are about
// topics, and the AI prompt handles tone. These are the terms that turn the
// Guide into an ad board or a slur generator.
const SPAM_OR_ABUSE =
	/\b(casino|viagra|cialis|porn|xxx|escort|onlyfans|slot ?gacor|togel|judi|bet365|airdrop|crypto ?giveaway|free ?money|buy ?now|cheap ?(pills|meds|viagra)|payday ?loans?|seo ?services?|backlinks?|nigg(er|a)s?|f[a4]gg?[o0]ts?|k[i1]kes?|tr[a4]nn(y|ies)|retards?|kys|kill ?yourself|heil ?hitler|white ?power|gas ?the)\b/;

const hasVowel = (word: string) => /[aeiouy]/.test(word);
const LONG_CONSONANT_RUN = /[bcdfghjklmnpqrstvwxz]{7,}/;

const looksRandom = (term: string): boolean =>
	term.split(/[\s-]+/).some((word) => {
		if (/\d/.test(word)) return false;
		if (word.length >= 6 && !hasVowel(word)) return true;
		return LONG_CONSONANT_RUN.test(word);
	});

/**
 * Decide whether `raw` may become a new Guide entry. `raw` is the decoded
 * slug or the typed search term, before normalization.
 */
export function checkGuideTerm(raw: string): GuideGateResult {
	const input = (raw ?? "").trim();
	if (!input) return { ok: false, reason: "empty" };
	if (input.length > GUIDE_TERM_MAX_LENGTH) return { ok: false, reason: "too-long" };

	const rawShape = checkRawShape(input);
	if (rawShape) return { ok: false, reason: rawShape };

	const term = normalizeSlug(input);
	if (!term) return { ok: false, reason: "empty" };
	if (!/^[a-z0-9][a-z0-9 -]*$/.test(term)) return { ok: false, reason: "characters" };
	if (term.split(/[\s-]+/).length > GUIDE_TERM_MAX_WORDS) {
		return { ok: false, reason: "too-many-words" };
	}

	const spaced = term.replace(/-/g, " ");
	if (RESERVED_TERMS.has(spaced) || RESERVED_SHAPE.test(spaced)) {
		return { ok: false, reason: "reserved" };
	}
	if (NORM_GLUED_FILE.test(term) || NORM_GLUED_FILE.test(spaced)) {
		return { ok: false, reason: "file-or-path" };
	}
	if (NORM_HASH.test(term)) return { ok: false, reason: "hash" };
	if (SPAM_OR_ABUSE.test(spaced)) return { ok: false, reason: "spam-or-abuse" };
	if (looksRandom(term)) return { ok: false, reason: "random" };
	if (isBlockedSearchTerm(input) || isBlockedSearchTerm(term)) {
		return { ok: false, reason: "blocklist" };
	}

	return { ok: true, term };
}

/**
 * Shape checks on the raw, un-normalized input. Exported for the slug page,
 * which must 404 these before its canonical redirect strips the dots
 * (`/settings.py` would otherwise redirect to `/settingspy` and generate).
 */
export function checkRawShape(input: string): GuideGateReason | null {
	if (RAW_FORBIDDEN_CHARS.test(input)) return "characters";
	if (RAW_ENCODED_SHAPE.test(input)) return "encoded";
	if (RAW_INJECTION_SHAPE.test(input)) return "injection";
	if (RAW_PATH_SHAPE.test(input)) return "file-or-path";
	if (RAW_FILE_SHAPE.test(input)) return "file-or-path";
	return null;
}

const URL_OR_MARKUP = /https?:\/\/|www\.|<[a-z/!]|\[url|\]\(|@[a-z0-9-]+\.[a-z]{2,}/i;

/**
 * Free-text fields on a manual submission. Links, markup, and spam/abuse
 * terms are rejected; length is enforced by the form schema.
 */
export function checkSubmissionText(fields: Record<string, string | undefined>): GuideGateResult {
	for (const value of Object.values(fields)) {
		if (!value) continue;
		if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
			return { ok: false, reason: "characters" };
		}
		if (URL_OR_MARKUP.test(value)) return { ok: false, reason: "spam-or-abuse" };
		if (SPAM_OR_ABUSE.test(value.toLowerCase())) return { ok: false, reason: "spam-or-abuse" };
		if (/<\s*script|javascript:|\bon\w+\s*=|union\s+select|drop\s+table/i.test(value)) {
			return { ok: false, reason: "injection" };
		}
	}
	return { ok: true, term: "" };
}

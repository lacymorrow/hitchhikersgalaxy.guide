/**
 * Vulnerability probe and spam blocklist for guide search terms.
 *
 * The guide generates entries from arbitrary URLs, so bots pound us with
 * paths like `/wp-admin.php`, `/dumpsql`, `/mainjs`. Any term matched here
 * fails `searchGuide` with an error, which makes the slug page call
 * `notFound()` — and Next.js injects `robots: noindex`. Keeping those URLs
 * out of the sitemap and the A-Z index stops Ahrefs from reporting them as
 * "noindex page in sitemap" / "orphan page".
 *
 * Extracted from guide-search.ts so the sitemap and /browse can import it
 * without pulling in the "use server" action module.
 */

const BLOCKED_PATTERNS = [
	// File extensions (with and without dot for normalized slugs)
	/\.php/i,
	/php\d*$/i,
	/\.asp/i,
	/aspx?$/i,
	/\.jsp/i,
	/jsp$/i,
	/\.cgi/i,
	/cgi$/i,
	/\.env/i,
	/^env/i,
	/env$/i,
	/\.git/i,
	/\.sql/i,
	/sql$/i,
	/\.bak/i,
	/bak$/i,
	/backup/i,
	/\.config/i,
	/config$/i,
	/\.ini/i,
	/ini$/i,
	/\.log/i,
	/log$/i,
	/\.xml/i,
	/xml$/i,
	/\.yml/i,
	/yml$/i,
	/\.yaml/i,
	/yaml$/i,
	/\.json/i,
	/json$/i,
	/\.zip/i,
	/zip$/i,
	/\.tar/i,
	/\.gz$/i,
	/\.js$/i,
	/js$/i,
	/^wp-?/i,
	/wordpress/i,
	/wpadmin/i,
	/wpcontent/i,
	/wpincludes/i,
	/wplogin/i,
	/xmlrpc/i,
	/phpmyadmin/i,
	/adminer/i,
	/^saml/i,
	/^sso$/i,
	/^idp$/i,
	/passwordvault/i,
	/oauth/i,
	/openid/i,
	/^aws/i,
	/^azure/i,
	/^boto$/i,
	/^s3cfg$/i,
	/docker/i,
	/kubernetes/i,
	/^k8s/i,
	/composer/i,
	/gitlab/i,
	/travis/i,
	/jenkins/i,
	/credential/i,
	/secret/i,
	/apikey/i,
	/api[_-]?key/i,
	/token/i,
	/password/i,
	/^gitconfig$/i,
	/^webconfig$/i,
	/sitemap/i,
	/^rss/i,
	/rss$/i,
	/^atom$/i,
	/atom$/i,
	/^feed/i,
	/feed$/i,
	/^ssrf$/i,
	/^curl$/i,
	/^fetch$/i,
	/^proxy$/i,
	/^redirect$/i,
	/^exec$/i,
	/^load$/i,
	/^request$/i,
	/etc\/?passwd/i,
	/etcpasswd/i,
	/etc\/?shadow/i,
	/etcshadow/i,
	/\.\.\/\.\.\//i,
	/\/root\//i,
	/\/admin\//i,
	/thumbsdb/i,
	/dsstore/i,
	/license\.?txt/i,
	/select\s+.*\s+from/i,
	/union\s+select/i,
	/insert\s+into/i,
	/drop\s+table/i,
	/--\s*$/,
	/;\s*--/,
	/<script/i,
	/javascript:/i,
	/onerror\s*=/i,
	/onload\s*=/i,
	/\/bin\/bash/i,
	/\/bin\/sh/i,
	/cmd\.exe/i,
	/cmdexe/i,
	/powershell/i,
	/webshell/i,
	/c99/i,
	/r57/i,
	/alfa/i,
	/^debug/i,
	/debug$/i,
	/_debug/i,
	/^clients-?registrations?$/i,
	/^register$/i,
	/^admin$/i,
	/^login$/i,
	/^logout$/i,
];

const BLOCKED_EXACT_TERMS = new Set([
	"js",
	"css",
	"api",
	"app",
	"get",
	"new",
	"old",
	"www",
	"tos",
	"co",
	"bc",
	"sa",
	"template",
	"nodesync",
	"secure",
]);

const ALLOWED_SHORT_TERMS = new Set(["ai", "uk", "us", "tv", "pc", "42"]);

const REAL_EIGHT_LETTER_WORDS = new Set([
	"dolphins",
	"penguins",
	"keyboard",
	"universe",
	"galactic",
	"spaceman",
	"starship",
	"asteroid",
	"magratha",
	"betelgeu",
	"infinite",
	"improbab",
	"pangalac",
	"garglebl",
]);

const isRandomGibberish = (term: string): boolean => {
	if (/^[a-z]{8}$/.test(term)) {
		return !REAL_EIGHT_LETTER_WORDS.has(term);
	}
	return false;
};

export const isBlockedSearchTerm = (term: string): boolean => {
	const lowerTerm = term.toLowerCase();

	if (term.length === 1) {
		return true;
	}

	if (term.length <= 2) {
		if (!ALLOWED_SHORT_TERMS.has(lowerTerm)) {
			return true;
		}
	}

	if (BLOCKED_EXACT_TERMS.has(lowerTerm)) {
		return true;
	}

	if (isRandomGibberish(lowerTerm)) {
		return true;
	}

	return BLOCKED_PATTERNS.some((pattern) => pattern.test(term));
};

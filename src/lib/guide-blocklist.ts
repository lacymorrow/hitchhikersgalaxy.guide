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
	/aspx$/i,
	/\.jsp/i,
	/jsp$/i,
	/\.cgi/i,
	/cgi$/i,
	/\.env/i,
	// Not /^env/ or /env$/: those blocked "environment", "envelope", "heaven".
	/^env(local|prod|production|dev|development|example|sample|staging|test|bak|backup|old|save|txt)?$/i,
	/dotenv$/i,
	/\.git/i,
	/\.sql/i,
	/sql$/i,
	/\.bak/i,
	/bak$/i,
	/backup/i,
	/\.config/i,
	/config$/i,
	/\.ini/i,
	/(php|my|config|settings|web|desktop|boot|win|system|user)ini$/i,
	/\.log/i,
	/(error|access|debug|install|php|server|app|laravel|wp|sql|npm|yarn)_?log$/i,
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
	/^aws(config|credentials?|keys?|s3)?$/i,
	/^azure/i,
	/^boto$/i,
	/^s3cfg$/i,
	/docker/i,
	/kubernetes/i,
	/^k8s/i,
	/composer(json|lock|phar)/i,
	/gitlab/i,
	/travis\.?ya?ml/i,
	/jenkins/i,
	/credential/i,
	/^(client_?)?secrets?(json|ya?ml|txt|key|env)?$/i,
	/apikey/i,
	/api[_-]?key/i,
	/token/i,
	/password/i,
	/^gitconfig$/i,
	/^webconfig$/i,
	/sitemap/i,
	/^rss/i,
	/rss$/i,
	/^atom(xml)?$/i,
	/atomxml$/i,
	/^feeds?(xml|rss|atom|json)?$/i,
	/(rss|atom)feed$/i,
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
	/^alfa(_|cgi|data|team|shell|rex)/i,
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

// Used to block every 8-letter word outside a short allowlist, which also
// blocked real topics ("elephant", "sandwich"). Now: only vowel-less ones.
const isRandomGibberish = (term: string): boolean =>
	/^[a-z]{8}$/.test(term) && !/[aeiouy]/.test(term);

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

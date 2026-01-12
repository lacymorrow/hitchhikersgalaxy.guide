"use server";

import { openai } from "@/lib/open-ai";
import { normalizeSlug } from "@/lib/utils";
import { guideService } from "@/server/services/guide-service";
import { rateLimitService, rateLimits } from "@/server/services/rate-limit-service";

// Blocklist patterns for vulnerability probes and spam
// Note: normalizeSlug removes dots, so "file.php" becomes "filephp"
const BLOCKED_PATTERNS = [
	// File extensions (with and without dot for normalized slugs)
	/\.php/i,
	/php\d*$/i, // catches "configphp", "indexphp", "php7" after normalization
	/\.asp/i,
	/aspx?$/i,
	/\.jsp/i,
	/jsp$/i,
	/\.cgi/i,
	/cgi$/i,
	/\.env/i,
	/^env/i, // env at start: env, envlocal, envproduction, etc.
	/env$/i, // env at end: blogenv, dockerenv, etc.
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
	/log$/i, // catches errorlog, debuglog, laravellog
	/\.xml/i,
	/xml$/i,
	/\.yml/i,
	/yml$/i,
	/\.yaml/i,
	/yaml$/i,
	/\.json/i,
	/json$/i, // catches configjson, secretsjson, etc.
	/\.zip/i,
	/zip$/i,
	/\.tar/i,
	/\.gz$/i,
	// JavaScript file probes
	/\.js$/i,
	/js$/i, // catches configjs, appjs, serverjs - but see minimum length check below
	// WordPress / CMS probes
	/^wp-?/i, // wp- or wp at start
	/wordpress/i,
	/wpadmin/i,
	/wpcontent/i,
	/wpincludes/i,
	/wplogin/i,
	/xmlrpc/i,
	/phpmyadmin/i,
	/adminer/i,
	// Auth/SSO probes
	/^saml/i,
	/^sso$/i,
	/^idp$/i,
	/passwordvault/i,
	/oauth/i,
	/openid/i,
	// Cloud/DevOps config probes
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
	// Credential/secret probes
	/credential/i,
	/secret/i,
	/apikey/i,
	/api[_-]?key/i,
	/token/i,
	/password/i,
	/^gitconfig$/i,
	/^webconfig$/i,
	// Sitemap/RSS/Feed probes
	/sitemap/i,
	/^rss/i,
	/rss$/i,
	/^atom$/i,
	/atom$/i,
	/^feed/i,
	/feed$/i,
	// SSRF probes
	/^ssrf$/i,
	/^curl$/i,
	/^fetch$/i,
	/^proxy$/i,
	/^redirect$/i,
	/^exec$/i,
	/^load$/i,
	/^request$/i,
	// Path traversal / system files
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
	// SQL injection patterns
	/select\s+.*\s+from/i,
	/union\s+select/i,
	/insert\s+into/i,
	/drop\s+table/i,
	/--\s*$/,
	/;\s*--/,
	// XSS patterns
	/<script/i,
	/javascript:/i,
	/onerror\s*=/i,
	/onload\s*=/i,
	// Shell / command injection
	/\/bin\/bash/i,
	/\/bin\/sh/i,
	/cmd\.exe/i,
	/cmdexe/i,
	/powershell/i,
	// Common attack tools/paths
	/webshell/i,
	/c99/i,
	/r57/i,
	/alfa/i,
	// Debug probes
	/^debug/i,
	/debug$/i,
	/_debug/i,
	// Registration/admin probes
	/^clients-?registrations?$/i,
	/^register$/i,
	/^admin$/i,
	/^login$/i,
	/^logout$/i,
];

// Exact match blocklist for short/common probe terms
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

// Check for random gibberish (8-char lowercase fuzzing strings)
const isRandomGibberish = (term: string): boolean => {
	// 8-character all-lowercase strings that don't form real words
	if (/^[a-z]{8}$/.test(term)) {
		// Allow some real 8-letter words
		const realWords = new Set([
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
		return !realWords.has(term);
	}
	return false;
};

const isBlockedSearchTerm = (term: string): boolean => {
	const lowerTerm = term.toLowerCase();

	// Block single characters
	if (term.length === 1) {
		return true;
	}

	// Block very short terms (2 chars or less) unless they're meaningful
	if (term.length <= 2) {
		const allowedShort = new Set(["ai", "uk", "us", "tv", "pc", "42"]);
		if (!allowedShort.has(lowerTerm)) {
			return true;
		}
	}

	// Check exact blocklist
	if (BLOCKED_EXACT_TERMS.has(lowerTerm)) {
		return true;
	}

	// Check for random gibberish
	if (isRandomGibberish(lowerTerm)) {
		return true;
	}

	// Check regex patterns
	return BLOCKED_PATTERNS.some((pattern) => pattern.test(term));
};

const generateGuideEntry = async (searchTerm: string) => {
	if (!openai) {
		throw new Error("OpenAI API key is not set.");
	}

	const prompt = `You are the Hitchhiker's Guide to the Galaxy. Write an entry about "${searchTerm}" in the style of Douglas Adams.

Format your response as a JSON object with the following structure:
{
  "content": "Main description (witty, slightly absurd, with British humor)",
  "travelAdvice": "Travel advisory (if applicable)",
  "whereToFind": "Where to find it (can be completely made up)",
  "whatToAvoid": "Warnings and cautions",
  "funFact": "A fun fact (preferably something ridiculous but plausible-sounding)",
  "advertisement": "A subtle advertisement for a related product or service",
  "reliability": number between 0-100,
  "dangerLevel": number between 0-100
}

Keep the total length under 400 words. Make it entertaining and informative, with that distinctive Douglas Adams style of mixing profound observations with complete nonsense.`;

	const completion = await openai.chat.completions.create({
		model: "gpt-4-1106-preview",
		messages: [
			{
				role: "system",
				content:
					"You are the Hitchhiker's Guide to the Galaxy, known for its witty, irreverent, and slightly absurd explanations of everything in the universe. Your entries should be both informative and entertaining, with a perfect mix of useful information and complete nonsense. Remember to maintain that distinctively British humor throughout. Avoid starting entries with 'not to be confused with' disclaimers—jump straight into the interesting bits. Always respond with valid JSON.",
			},
			{
				role: "user",
				content: prompt,
			},
		],
		temperature: 0.9,
		max_tokens: 800,
		response_format: { type: "json_object" },
		functions: [
			{
				name: "create_guide_entry",
				parameters: {
					type: "object",
					properties: {
						content: { type: "string" },
						travelAdvice: { type: "string" },
						whereToFind: { type: "string" },
						whatToAvoid: { type: "string" },
						funFact: { type: "string" },
						advertisement: { type: "string" },
						reliability: { type: "integer", minimum: 0, maximum: 100 },
						dangerLevel: { type: "integer", minimum: 0, maximum: 100 },
					},
					required: [
						"content",
						"travelAdvice",
						"whereToFind",
						"whatToAvoid",
						"funFact",
						"advertisement",
						"reliability",
						"dangerLevel",
					],
				},
			},
		],
	});

	const response = completion.choices[0]?.message?.function_call?.arguments;
	if (!response) {
		throw new Error("Failed to generate guide entry");
	}

	return JSON.parse(response);
};

export const searchGuide = async (searchTerm: string, exactMatch = false) => {
	console.log("[searchGuide] Original searchTerm:", searchTerm, "exactMatch:", exactMatch);
	const normalizedSearchTerm = normalizeSlug(searchTerm);
	console.log("[searchGuide] Normalized searchTerm for processing:", normalizedSearchTerm);

	if (!normalizedSearchTerm) {
		console.log("[searchGuide] Normalized searchTerm is empty, returning error.");
		return {
			success: false,
			error: "Search term is required after normalization",
		};
	}

	// Block vulnerability probes and spam patterns
	if (isBlockedSearchTerm(searchTerm) || isBlockedSearchTerm(normalizedSearchTerm)) {
		console.log("[searchGuide] Blocked spam/vulnerability probe:", searchTerm);
		return {
			success: false,
			error: "This search term is not permitted in the Guide.",
		};
	}

	// Rate limiting
	try {
		await rateLimitService.checkLimit("guide-search", searchTerm, rateLimits.api.search);
	} catch (error) {
		console.error("[Guide Search] Rate limit error:", error);
		return {
			success: false,
			error: "Too many searches. Please try again in a minute.",
		};
	}

	// First, try to find an existing entry using the normalized term
	try {
		console.log(
			"[searchGuide] Attempting to find existing entry with normalized term:",
			normalizedSearchTerm
		);
		const existingEntry = await guideService.findExistingEntry(normalizedSearchTerm, exactMatch);
		if (existingEntry) {
			console.log("[searchGuide] Found existing entry:", existingEntry);
			return {
				success: true,
				data: { ...existingEntry, searchTerm: normalizedSearchTerm },
			};
		}
		console.log("[searchGuide] No existing entry found for normalized term:", normalizedSearchTerm);
	} catch (error) {
		console.error("[Guide Search] Database search error:", error);
		// Don't return error here, try to create a new entry instead
		// This prevents 403 errors when database search fails but creation might work
	}

	// If no entry exists, generate one using AI
	try {
		if (!openai) {
			console.error("[Guide Search] OpenAI API key is not configured");
			return {
				success: false,
				error: "Our researchers are currently indisposed. Please try again later.",
			};
		}

		console.log(
			"[searchGuide] Generating new entry with original term for AI context:",
			searchTerm
		);
		const entryContent = await generateGuideEntry(searchTerm);
		try {
			console.log(
				"[searchGuide] Creating new entry in DB with normalized term:",
				normalizedSearchTerm,
				"and content:",
				entryContent
			);
			const newEntry = await guideService.createEntry({
				searchTerm: normalizedSearchTerm,
				...entryContent,
			});
			console.log("[searchGuide] Successfully created new entry:", newEntry);
			return {
				success: true,
				data: { ...newEntry, searchTerm: normalizedSearchTerm },
			};
		} catch (dbError) {
			console.error("[Guide Search] Database creation error:", dbError);
			return {
				success: false,
				error: "Failed to save your search to the Guide. Please try again later.",
			};
		}
	} catch (error) {
		console.error("[Guide Search] AI generation error:", error);
		let errorMessage =
			"Our researchers are currently indisposed in the Restaurant at the End of the Universe. Please try again later.";

		if (error instanceof Error) {
			// If it's an OpenAI API error, provide a more specific message
			if (error.message.includes("OpenAI")) {
				errorMessage = "Our AI researchers are taking a tea break. Please try again in a moment.";
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
};

"use server";

import { isBlockedSearchTerm } from "@/lib/guide-blocklist";
import type { GuideSearchFailure } from "@/lib/guide-read";
import { openai } from "@/lib/open-ai";
import { normalizeSlug } from "@/lib/utils";
import { checkGuideTerm } from "@/lib/guide-gate";
import { allowGuideCreation } from "@/server/services/guide-generation-limit";
import { guideService } from "@/server/services/guide-service";


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

/**
 * Everything below the happy path is one of two answers, and the slug page
 * owes visitors and Googlebot a different HTTP status for each.
 *
 * `not_found` is a judgement about the term: empty after normalization, or
 * refused by the gate. Nothing was attempted, a retry changes nothing, 404 is
 * the truth.
 *
 * `unavailable` is a judgement about the Guide: the lookup, the generation or
 * the write did not come back. It is no evidence that the term has no entry,
 * so it has to end in a retryable 5xx. Google drops a 404 and retries a 503,
 * and flattening these two into one `{ success: false }` is how an unreachable
 * database told it that ~309 indexed entries had stopped existing (LAC-5648).
 */
type GuideSearchMiss = {
	readonly success: false;
	readonly status: GuideSearchFailure;
	readonly error: string;
};

const notInTheGuide = (error: string): GuideSearchMiss => ({
	success: false,
	status: "not_found",
	error,
});

const guideUnavailable = (error: string): GuideSearchMiss => ({
	success: false,
	status: "unavailable",
	error,
});

/** Same voice as the `GuideUnavailable` state, which says the same thing. */
const RECORDS_UNREACHABLE =
	"The Guide can't reach its records right now. The entries are all still there.";

export const searchGuide = async (searchTerm: string, exactMatch = false) => {
	const normalizedSearchTerm = normalizeSlug(searchTerm);

	if (!normalizedSearchTerm) {
		return notInTheGuide("Search term is required after normalization");
	}

	// Block vulnerability probes and spam patterns
	if (isBlockedSearchTerm(searchTerm) || isBlockedSearchTerm(normalizedSearchTerm)) {
		console.log("[searchGuide] Blocked spam/vulnerability probe:", searchTerm);
		return notInTheGuide("This search term is not permitted in the Guide.");
	}

	// First, try to find an existing entry using the normalized term.
	// A failed lookup used to fall through to generation, which is how an
	// outage spent an OpenAI call per request on entries that were already
	// written and then discarded the result against the same dead database.
	const existing = await guideService.findExistingEntry(normalizedSearchTerm, exactMatch);
	if (existing.status === "unavailable") {
		console.error("[searchGuide] Lookup unavailable, not generating:", normalizedSearchTerm);
		return guideUnavailable(RECORDS_UNREACHABLE);
	}
	if (existing.data) {
		return {
			success: true,
			status: "ok",
			data: { ...existing.data, searchTerm: normalizedSearchTerm },
		} as const;
	}

	// Nothing stored yet. Before spending an OpenAI call and writing a row,
	// the term has to pass the gate (probes, payloads, test names, spam)
	// and the creation limits. Failing the gate is a plain miss: the slug
	// page 404s, nothing is written. Failing a limit is not -- the caps are
	// hourly and per-IP minutes, so the term may well exist on a retry.
	const gate = checkGuideTerm(searchTerm);
	if (!gate.ok) {
		console.log("[searchGuide] Gate rejected new term:", normalizedSearchTerm, gate.reason);
		return notInTheGuide("This search term is not permitted in the Guide.");
	}
	if (!(await allowGuideCreation())) {
		return guideUnavailable("Too many new entries right now. Please try again in a few minutes.");
	}

	if (!openai) {
		console.error("[Guide Search] OpenAI API key is not configured");
		return guideUnavailable("Our researchers are currently indisposed. Please try again later.");
	}

	// If no entry exists, generate one using AI
	let entryContent: Awaited<ReturnType<typeof generateGuideEntry>>;
	try {
		entryContent = await generateGuideEntry(searchTerm);
	} catch (error) {
		console.error("[Guide Search] AI generation error:", error);
		// An OpenAI failure says nothing about whether the term belongs in the
		// Guide, so it is unavailable rather than missing.
		const errorMessage =
			error instanceof Error && error.message.includes("OpenAI")
				? "Our AI researchers are taking a tea break. Please try again in a moment."
				: "Our researchers are currently indisposed in the Restaurant at the End of the Universe. Please try again later.";
		return guideUnavailable(errorMessage);
	}

	try {
		const newEntry = await guideService.createEntry({
			searchTerm: normalizedSearchTerm,
			...entryContent,
		});
		return {
			success: true,
			status: "ok",
			data: { ...newEntry, searchTerm: normalizedSearchTerm },
		} as const;
	} catch (dbError) {
		console.error("[Guide Search] Database creation error:", dbError);
		return guideUnavailable("Failed to save your search to the Guide. Please try again later.");
	}
};

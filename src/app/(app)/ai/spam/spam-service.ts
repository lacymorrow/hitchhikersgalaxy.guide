import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	dangerouslyAllowBrowser: true,
});

export interface SpamPrediction {
	label: "Spam" | "Not Spam";
	score: number;
	explanation: string;
}

function preprocessText(text: string): string {
	if (!text) return "";
	return text.trim();
}

function getExplanation(isSpam: boolean, score: number): string {
	const confidence = Math.round(score * 100);
	return isSpam
		? `This message was classified as spam with ${confidence}% confidence.`
		: `This message appears to be legitimate with ${confidence}% confidence.`;
}

export async function detectSpam(text: string): Promise<SpamPrediction> {
	const processedText = preprocessText(text);

	if (!processedText) {
		return {
			label: "Not Spam",
			score: 1,
			explanation: "Empty messages are considered non-spam by default.",
		};
	}

	const completion = await openai.chat.completions.create({
		model: "gpt-3.5-turbo",
		messages: [
			{
				role: "system",
				content: `You are a spam detection expert. Analyze the following message and determine if it is spam.

Key characteristics of spam:
- Unsolicited commercial content with aggressive sales tactics
- Excessive use of capital letters and exclamation marks
- High-pressure urgency or time-limited offers
- Unrealistic promises of money, prizes, or rewards
- Poor grammar, suspicious formatting, or random characters
- Multiple links to unknown or suspicious websites
- Requests for sensitive personal or financial information
- Lack of legitimate business context or contact information

Key characteristics of legitimate messages:
- Professional business communications with clear context
- Normal capitalization and punctuation usage
- Reasonable job offers or business opportunities with company details
- Well-structured content with proper formatting
- Clear sender identification and business context
- Official company domains and contact information
- Balanced and professional tone without high pressure
- Specific details about the business relationship or purpose

Respond with a JSON object containing:
- isSpam (boolean): true for spam, false for legitimate messages
- confidence (number):
  - 0.9-1.0 for clear legitimate business communications
  - 0.8-0.9 for likely legitimate messages
  - 0.7-0.8 for borderline but probably legitimate
  - 0.7-1.0 for clear spam
  - 0.6-0.7 for borderline but suspicious messages`,
			},
			{
				role: "user",
				content: processedText,
			},
		],
		response_format: { type: "json_object" },
	});

	if (!completion.choices[0]?.message?.content) {
		throw new Error("Invalid response from OpenAI");
	}

	const response = JSON.parse(completion.choices[0].message.content);
	const isSpam = response.isSpam;
	const score = response.confidence;

	return {
		label: isSpam ? "Spam" : "Not Spam",
		score,
		explanation: getExplanation(isSpam, score),
	};
}

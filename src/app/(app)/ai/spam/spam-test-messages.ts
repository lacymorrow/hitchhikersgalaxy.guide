interface TestMessage {
	text: string;
	description: string;
	isSpam: boolean;
}

export const spamMessages: TestMessage[] = [
	{
		text: "CLICK HERE to get FREE MONEY! Buy now at discount! Limited time offer! Act now! 100% guaranteed! Make money fast! No obligation!",
		description: "Basic spam with multiple spam indicators",
		isSpam: true,
	},
	{
		text: "CONGRATULATIONS! You've WON! Click now to claim your FREE PRIZE! $500 CASH waiting for you! No purchase necessary! 100% GUARANTEED! Limited time offer! ACT NOW!",
		description: "Aggressive spam with multiple triggers",
		isSpam: true,
	},
	{
		text: "Hi Sarah, Just following up on our meeting last week. By the way, I found this amazing opportunity - CLICK HERE to earn $1000 daily from home!",
		description: "Mixed content with spam",
		isSpam: true,
	},
	{
		text: "YXLCQqqTKcQNSDv : BIkWnVKyAmpa",
		description: "spam",
		isSpam: true,
	},
	// Add more spam messages here
];

export const legitimateMessages: TestMessage[] = [
	{
		text: "Hello, I hope this email finds you well. I wanted to schedule a meeting next week to discuss our upcoming project milestones.",
		description: "Professional business communication",
		isSpam: false,
	},
	{
		text: "Hello\n\n  This is a   test   message  \nWith multiple lines.\nBest regards,\nJohn",
		description: "Formatted message with special characters",
		isSpam: false,
	},
	{
		text: `Dear valued customer,
    We hope this message finds you well. We are writing to inform you about our latest product updates
    and improvements. Our team has been working diligently to enhance your experience with our services.
    We've implemented new features based on your feedback and streamlined our processes to better serve you.`,
		description: "Long legitimate business update",
		isSpam: false,
	},
	{
		text: "Re: Remote Job Opportunity with ROHTO Pharmaceutical Greetings, Mr./Ms. With all due respect. We are looking for a Spokesperson/Financial Coordinator for ROHTO Pharmaceutical Co., Ltd. based in the USA, Canada, or Europe. This part-time role offers a minimum $5k salary and requires only a few minutes of your time daily. It will not create any conflicts if you work with other companies. If interested, please contact apply@rohtopharmaceutical.com Best regards, Yasuhiro Yamada Senior Executive Officer https://rohtopharmaceutical.com/",
		description: "Long legitimate business update",
		isSpam: false,
	},
	// Add more legitimate messages here
];

// Special test cases
export const specialCases: TestMessage[] = [
	{
		text: "",
		description: "Empty message",
		isSpam: false,
	},
	{
		text: "   ",
		description: "Whitespace only",
		isSpam: false,
	},
	// Add more special cases here
];

// Helper function to get all test messages
export function getAllTestMessages(): TestMessage[] {
	return [...spamMessages, ...legitimateMessages, ...specialCases];
}

// Helper function to get test messages by type
export function getTestMessagesByType(
	type: "spam" | "legitimate" | "special",
): TestMessage[] {
	switch (type) {
		case "spam":
			return spamMessages;
		case "legitimate":
			return legitimateMessages;
		case "special":
			return specialCases;
	}
}

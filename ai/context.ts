/**
 * ShipKit Project Context
 * Last Updated: [Current Date]
 */

interface ProjectContext {
	currentState: {
		authentication: {
			providers: string[];
			implementation: string;
		};
		database: {
			type: string;
			host: string;
			prefix: string;
		};
		services: {
			ai: string[];
			payment: string;
			cms: string;
			email: string;
		};
		routing: {
			structure: string;
			adminSection: boolean;
		};
	};

	pendingTasks: string[];
	completedTasks: string[];
}

export const context: ProjectContext = {
	currentState: {
		authentication: {
			providers: ["Discord", "GitHub", "Google"],
			implementation: "NextAuth/AuthJS v5",
		},
		database: {
			type: "PostgreSQL",
			host: "Neon.tech",
			prefix: "shipkit",
		},
		services: {
			ai: ["OpenAI", "Anthropic", "Google AI"],
			payment: "LemonSqueezy",
			cms: "Payload",
			email: "Resend",
		},
		routing: {
			structure: "App Router",
			adminSection: true,
		},
	},

	pendingTasks: [
		"Review and optimize authentication flow",
		"Ensure proper error handling in API integrations",
		"Validate database operations",
		"Implement proper TypeScript types across components",
	],

	completedTasks: [],
};

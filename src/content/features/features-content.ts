import type { Feature } from "@/types/feature";

type FeatureContent = Omit<Feature, "id" | "order">;

export const content: FeatureContent[] = [
	// Performance & Core Technology
	{
		name: "10x Faster Development",
		description:
			"Ship in days, not months. Our pre-built stack with Next.js 15 and React Server Components eliminates weeks of setup and configuration.",
		category: "core",
		plans: ["bones", "muscles", "brains"],
		icon: "Zap",
	},
	{
		name: "Bank-Grade Security",
		description:
			"Enterprise security out of the box with Auth.js v5, rate limiting, and SOC2-ready infrastructure. Used by Fortune 500 companies.",
		category: "security",
		plans: ["brains"],
		icon: "Lock",
	},
	{
		name: "Future-Proof Architecture",
		description:
			"Never worry about tech debt again. Built with Next.js 15, Tailwind CSS, and Shadcn/UI - the same stack used by industry leaders.",
		category: "core",
		plans: ["bones", "muscles", "brains"],
		icon: "Layers",
	},
	{
		name: "AI-First Development",
		description:
			"Built-in OpenAI integration lets you automate tedious tasks and add AI features your users will love. Stay ahead of competitors.",
		category: "advanced",
		plans: ["brains"],
		icon: "Brain",
	},

	// Developer Experience
	{
		name: "Developer Happiness",
		description:
			"A development environment your team will love. Instant hot reload, VS Code integration, and tools that make coding feel magical.",
		category: "dx",
		plans: ["bones", "muscles", "brains"],
		icon: "Code",
	},
	{
		name: "Zero Runtime Errors",
		description:
			"End-to-end type safety with TypeScript and Drizzle ORM catches bugs before they reach production. Ship with absolute confidence.",
		category: "dx",
		plans: ["bones", "muscles", "brains"],
		icon: "Shield",
	},

	// Design & UI
	{
		name: "Stunning UI in Minutes",
		description:
			"Launch with a beautiful, professional design using our pre-built Shadcn/UI components. No designer needed to look world-class.",
		category: "core",
		plans: ["bones", "muscles", "brains"],
		icon: "Paintbrush",
	},

	// Backend & Infrastructure
	{
		name: "Enterprise-Ready Backend",
		description:
			"Scale confidently with our battle-tested PostgreSQL + Drizzle ORM setup. Automatic backups and type-safe queries included.",
		category: "backend",
		plans: ["muscles", "brains"],
		icon: "Database",
	},
	{
		name: "One-Click Auth",
		description:
			"Get users signed up in seconds with multi-provider authentication. Supports Google, Apple, GitHub and more out of the box.",
		category: "security",
		plans: ["bones", "muscles", "brains"],
		icon: "Lock",
	},

	// Marketing & SEO
	{
		name: "SEO & Marketing Tools",
		description:
			"Rank higher on Google with automatic SEO optimization, social cards, and structured data. Built-in marketing tools that work.",
		category: "core",
		plans: ["bones", "muscles", "brains"],
		icon: "Search",
	},
	{
		name: "Content Management",
		description:
			"Give your team the power to update content without developers. Payload CMS and Builder.io make content management effortless.",
		category: "core",
		plans: ["muscles", "brains"],
		icon: "FileText",
	},

	// Communication
	{
		name: "Professional Email System",
		description:
			"Beautiful transactional emails that actually reach inboxes. Built-in templates and Resend integration for reliable delivery.",
		category: "core",
		plans: ["muscles", "brains"],
		icon: "Mail",
	},

	// Monitoring & Analytics
	{
		name: "Complete Observability",
		description:
			"Sleep better at night with built-in error tracking, performance monitoring, and analytics. Know exactly how your app is performing.",
		category: "core",
		plans: ["brains"],
		icon: "LineChart",
	},

	// Deployment & DevOps
	{
		name: "Production-Ready DevOps",
		description:
			"Deploy to production in minutes with our zero-downtime deployment pipeline. Includes Docker support and CI/CD workflows.",
		category: "devops",
		plans: ["muscles", "brains"],
		icon: "Rocket",
	},

	// Support
	{
		name: "Enterprise Support",
		description:
			"Launch with confidence knowing you're GDPR compliant, WCAG accessible, and following security best practices. Ready for business.",
		category: "support",
		plans: ["brains"],
		icon: "CheckCircle",
	},
];

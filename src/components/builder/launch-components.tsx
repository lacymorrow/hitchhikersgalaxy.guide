// Todo
"use client";

import { Link } from "@/components/primitives/link-with-transition";
import { Section } from "@/components/primitives/section";
import { buttonVariants } from "@/components/ui/button";
import { CodeWindow } from "@/components/ui/code-window";
import { cn } from "@/lib/utils";
import { Builder } from "@builder.io/react";
import { ArrowRightIcon, RocketIcon } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import server components
const ParticlesHero = dynamic(
	() =>
		import("@/components/ui/particles-hero").then(
			(mod) => mod.ParticlesHero,
		),
	{ ssr: true },
);

const PricingSectionSubtle = dynamic(
	() =>
		import("@/app/(app)/(landing)/_components/pricing-section-subtle").then(
			(mod) => mod.PricingSectionSubtle,
		),
	{ ssr: true },
);

const FAQ = dynamic(
	() => import("@/app/(app)/(landing)/_components/faq").then((mod) => mod.FAQ),
	{ ssr: true },
);

const LemonSqueezyButton = dynamic(
	() =>
		import("@/app/(app)/(landing)/_components/LemonSqueezyButton").then(
			(mod) => mod.LemonSqueezyButton,
		),
	{ ssr: true },
);

// Export components for Builder.io registration
export const LaunchHero = Builder.registerComponent(
	function LaunchHero({
		title,
		description,
	}: {
		title: string;
		description: string;
	}) {
		return (
			<ParticlesHero className="flex min-h-[50vh] flex-col items-center justify-center px-4">
				<div className="container relative z-10 mx-auto flex flex-col items-center justify-center gap-4 text-center">
					<h1 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
						{title}
					</h1>
					<p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
						{description}
					</p>
					<div className="flex gap-4">
						<LemonSqueezyButton />
					</div>
				</div>
			</ParticlesHero>
		);
	},
	{
		name: "LaunchHero",
		inputs: [
			{
				name: "title",
				type: "string",
				defaultValue: "Launch Your App Today",
			},
			{
				name: "description",
				type: "string",
				defaultValue:
					"Get instant access to production-ready code and start building right away.",
			},
		],
	},
);

export const QuickStart = Builder.registerComponent(
	function QuickStart({
		steps,
	}: {
		steps: { title: string; description: string; icon: string }[];
	}) {
		return (
			<Section className="container">
				<h2 className="mb-12 text-center text-3xl font-bold">
					Launch in Minutes
				</h2>
				<div className="grid gap-8 md:grid-cols-3">
					{steps.map((step, index) => (
						<div
							key={step.title}
							className="flex flex-col items-center text-center"
						>
							<div className="mb-4 text-4xl">{step.icon}</div>
							<h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
							<p className="text-muted-foreground">{step.description}</p>
							{index < steps.length - 1 && (
								<ArrowRightIcon className="hidden rotate-90 text-muted-foreground/30 md:block md:rotate-0" />
							)}
						</div>
					))}
				</div>
			</Section>
		);
	},
	{
		name: "QuickStart",
		inputs: [
			{
				name: "steps",
				type: "list",
				subFields: [
					{
						name: "title",
						type: "string",
					},
					{
						name: "description",
						type: "string",
					},
					{
						name: "icon",
						type: "string",
					},
				],
				defaultValue: [
					{
						title: "Choose Your Plan",
						description: "Select the plan that matches your project needs",
						icon: "🎯",
					},
					{
						title: "Get Instant Access",
						description: "Receive immediate access to your codebase",
						icon: "⚡",
					},
					{
						title: "Start Building",
						description: "Follow our quick start guide and launch fast",
						icon: "🚀",
					},
				],
			},
		],
	},
);

export const CodePreview = Builder.registerComponent(
	function CodePreview({
		code,
		language,
		title,
	}: {
		code: string;
		language: string;
		title: string;
	}) {
		return (
			<Section className="container">
				<div className="mx-auto max-w-4xl">
					<CodeWindow title={title} language={language} code={code} />
				</div>
			</Section>
		);
	},
	{
		name: "CodePreview",
		inputs: [
			{
				name: "title",
				type: "string",
				defaultValue: "Quick Start",
			},
			{
				name: "language",
				type: "string",
				defaultValue: "bash",
			},
			{
				name: "code",
				type: "longText",
				defaultValue: `# Clone the repository
git clone https://github.com/your-username/shipkit.git

# Install dependencies
npm install

# Start development server
npm run dev

# Your app is now running at http://localhost:3000 🚀`,
			},
		],
	},
);

export const PricingSection = Builder.registerComponent(
	function PricingSection() {
		return (
			<Section className="container">
				<h2 className="mb-12 text-center text-3xl font-bold">
					Ready to Launch?
				</h2>
				<PricingSectionSubtle />
				<div className="mt-8 text-center">
					<Link
						href="/pricing"
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"font-semibold",
						)}
					>
						Compare All Features
					</Link>
				</div>
			</Section>
		);
	},
	{
		name: "PricingSection",
	},
);

export const FAQSection = Builder.registerComponent(
	function FAQSection() {
		return (
			<Section className="container">
				<div className="mx-auto max-w-3xl">
					<FAQ />
				</div>
			</Section>
		);
	},
	{
		name: "FAQSection",
	},
);

export const CTASection = Builder.registerComponent(
	function CTASection({
		title,
		description,
	}: {
		title: string;
		description: string;
	}) {
		return (
			<Section className="container">
				<div className="mx-auto max-w-2xl text-center">
					<RocketIcon className="mx-auto mb-6 size-12 text-primary" />
					<h2 className="mb-4 text-3xl font-bold">{title}</h2>
					<p className="mb-8 text-muted-foreground">{description}</p>
					<LemonSqueezyButton />
				</div>
			</Section>
		);
	},
	{
		name: "CTASection",
		inputs: [
			{
				name: "title",
				type: "string",
				defaultValue: "Ready for Takeoff?",
			},
			{
				name: "description",
				type: "string",
				defaultValue:
					"Join developers who are building production-ready applications with ShipKit.",
			},
		],
	},
);

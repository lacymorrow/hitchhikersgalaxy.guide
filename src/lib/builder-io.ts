/*
 * This file is used to initialize the Builder SDK
 * @see https://www.builder.io/c/docs/sdk-setup
 *
 * @returns builder
 *
 * @example
 * const builder = builderInit();
 */

import { env } from "@/env";
import { Builder } from "@builder.io/react";
import dynamic from "next/dynamic";

// Register your components here
const BUILDER_COMPONENTS = {
	LAUNCH_HERO: "LaunchHero",
	QUICK_START: "QuickStart",
	CODE_PREVIEW: "CodePreview",
	PRICING_SECTION: "PricingSection",
	FAQ_SECTION: "FAQSection",
	CTA_SECTION: "CTASection",
} as const;

export type BuilderComponent = keyof typeof BUILDER_COMPONENTS;

// Initialize Builder with your public API key
Builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY!);

// Register custom components
export function registerComponents() {
	// Register your components here
	Object.values(BUILDER_COMPONENTS).forEach((component) => {
		Builder.registerComponent(
			dynamic(() =>
				import("@/components/builder/launch-components").then(
					(mod) => mod[component],
				),
			),
			{
				name: component,
				inputs: [], // Component inputs will be defined in the component file
			},
		);
	});
}

// Export builder instance
export { Builder as builder };

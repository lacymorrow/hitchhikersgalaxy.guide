import * as RadixIcons from "@radix-ui/react-icons";
import * as LucideIcons from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { isValidElementType } from "react-is";
import { Card } from "@/components/modules/mdx/card";
import { CardGroup } from "@/components/modules/mdx/card-group";
import { H1, H2, H3, H4, H5, H6 } from "@/components/modules/mdx/heading";
import { SecretGenerator } from "@/components/modules/mdx/secret-generator";
import { Prose } from "@/components/primitives/prose";
import * as AlertComponents from "@/components/ui/alert";
import { FileTree } from "@/components/ui/file-tree";
import { siteConfig } from "@/config/site-config";

// Filter the icon libraries to only include valid React components
function filterForMDXComponents(module: Record<string, unknown>): MDXComponents {
	return Object.fromEntries(
		Object.entries(module).filter(([, value]) => {
			// Only include valid React component types
			return isValidElementType(value);
		})
	) as MDXComponents;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
	<Prose id="sk-mdx-wrapper" className="container mx-auto py-10">
		{children}
	</Prose>
);

export function useMDXComponents(components: MDXComponents): MDXComponents {
	// const fumadocsComponents = await import('fumadocs-ui/mdx');

	return {
		wrapper,
		// ...filterForMDXComponents(fumadocsComponents),

		// Icon libraries
		...filterForMDXComponents(LucideIcons),
		...filterForMDXComponents(RadixIcons),

		// UI primitives
		...AlertComponents,
		Card,
		CardGroup,
		FileTree,
		SecretGenerator,
		SiteName: () => <>{siteConfig.title}</>,

		// Headings with automatic ids for deep-linking and TOC
		h1: H1,
		h2: H2,
		h3: H3,
		h4: H4,
		h5: H5,
		h6: H6,

		...components,
	};
}

import { siteConfig } from "@/config/site-config";

/**
 * JSON-LD structured data for repository discovery.
 *
 * Outputs a Schema.org SoftwareSourceCode block so that crawlers and
 * AI agents can locate the project's public repository from the website.
 */
export function RepoJsonLd() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareSourceCode",
		name: siteConfig.title,
		description: siteConfig.description,
		url: siteConfig.url,
		codeRepository: siteConfig.repo.url,
		programmingLanguage: "TypeScript",
		author: {
			"@type": "Person",
			name: siteConfig.creator.fullName,
			url: siteConfig.creator.url,
		},
	};

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires innerHTML
			dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
		/>
	);
}

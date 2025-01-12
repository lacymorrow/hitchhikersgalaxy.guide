import data from "@/registry/r/docs.json"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DocExamples } from "../components/doc-examples"
import { DocHeader } from "../components/doc-header"
import { DocInstallation } from "../components/doc-installation"
import { DocMetadata } from "../components/doc-metadata"
import { DocPreview } from "../components/doc-preview"
import { DocProps } from "../components/doc-props"

interface DocItem {
	name: string
	type: "registry:block" | "registry:ui" | "registry:hook" | "registry:lib" | "registry:component" | "registry:theme" | "registry:page"
	library: string
	sourcePath: string
	previewPath?: string
	files: Array<{
		path: string
		content: string
		type: "registry:block" | "registry:ui" | "registry:hook" | "registry:lib" | "registry:component" | "registry:theme" | "registry:page" | "preview"
		target?: string
	}>
	dependencies: string[]
	devDependencies: never[]
	registryDependencies: string[]
	meta?: {
		library?: string
		hasPreview?: boolean
		[key: string]: any
	}
	description?: string
}

interface DocsPageProps {
	params: Promise<{
		slug?: string[]
	}>
}

const items = data as DocItem[]

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
	const pageParams = await params
	const slug = pageParams.slug?.join("/") || ""
	const item = items.find(c => c?.name === slug || c?.name === pageParams.slug?.[pageParams.slug.length - 1])

	if (!item) {
		return {
			title: "Not Found",
			description: "The page you're looking for doesn't exist.",
		}
	}

	return {
		title: `${item.name} - UI Documentation`,
		description: item.description || `Documentation for the ${item.name} component.`,
	}
}

export default async function DocsPage({ params }: DocsPageProps) {
	const pageParams = await params
	const slug = pageParams.slug?.join("/") || ""
	const item = items.find(c => c?.name === slug || c?.name === pageParams.slug?.[pageParams.slug.length - 1])

	if (!item) {
		notFound()
	}

	return (
		<div className="min-h-screen bg-background">
			<main className="relative py-6 lg:gap-10 lg:py-8">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="space-y-12">
						<DocHeader item={item} />
						<DocMetadata item={item} />
						{item.meta?.hasPreview && (
							<DocPreview previewPath={item.previewPath} component={item.name} library={item.meta?.library} />
						)}
						<DocInstallation item={item} />
						<DocProps item={item} />
						<DocExamples item={item} />
					</div>
				</div>
			</main>
		</div>
	)
}

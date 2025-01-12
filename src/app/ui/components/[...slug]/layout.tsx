import type { ReactNode } from "react"
import type { RegistryItem } from "../../../../registry/schema"
import { DocSidebar } from "../components/doc-sidebar"
import { getRegistryItems } from "../generate-docs"

interface DocsLayoutProps {
	children: ReactNode
	params: Promise<{
		slug?: string[]
	}>
}

interface RegistryGroup {
	[key: string]: RegistryItem[]
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
	const registry = await getRegistryItems() as RegistryGroup

	return (
		<div className="relative min-h-screen bg-background">
			<div className="container mx-auto py-10">
				<div className="grid grid-cols-[220px_1fr] gap-12">
					<DocSidebar registry={registry} />
					<div className="min-h-screen">
						{children}
					</div>
				</div>
			</div>
		</div>
	)
}

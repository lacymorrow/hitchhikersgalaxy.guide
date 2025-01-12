import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getRegistryItems } from "./generate-docs"

export default async function DocsPage() {
	const registry = await getRegistryItems()

	return (
		<div className="space-y-8">
			<PageHeader>
				<PageHeaderHeading>Documentation</PageHeaderHeading>
				<PageHeaderDescription>
					Browse our collection of components, hooks, and utilities.
				</PageHeaderDescription>
			</PageHeader>

			<div className="space-y-8">
				{Object.entries(registry).map(([category, items]) => (
					<div key={category} className="space-y-4">
						<h2 className="text-2xl font-bold tracking-tight capitalize">
							{category}
						</h2>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{items.map((item) => (
								<Link key={item.name} href={`/ui/docs/${category}/${item.name}`}>
									<Card className="hover:bg-muted/50 transition-colors">
										<CardHeader>
											<CardTitle className="capitalize">{item.name.replace(/-/g, " ")}</CardTitle>
											{item.description && (
												<CardDescription>{item.description}</CardDescription>
											)}
										</CardHeader>
										<CardContent>
											<div className="flex flex-wrap gap-2">
												<Badge variant="secondary" className="capitalize">
													{item.type.replace("registry:", "")}
												</Badge>
												{item.categories?.map((cat) => (
													<Badge key={cat} variant="outline">
														{cat}
													</Badge>
												))}
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

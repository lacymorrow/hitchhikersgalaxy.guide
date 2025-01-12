"use client"

import { type RegistryItem } from "../../../../registry/schema"

interface DocInstallationProps {
	item: RegistryItem
}

export function DocInstallation({ item }: DocInstallationProps) {
	const hasDependencies = item.dependencies && item.dependencies.length > 0

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
	}

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold tracking-tight">Installation</h2>

			{item.registryDependencies && item.registryDependencies.length > 0 && (
				<div className="space-y-2">
					<p className="text-muted-foreground">Required components:</p>
					<ul className="list-disc list-inside space-y-1 text-muted-foreground">
						{item.registryDependencies.map((dep) => (
							<li key={dep}>{dep}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}

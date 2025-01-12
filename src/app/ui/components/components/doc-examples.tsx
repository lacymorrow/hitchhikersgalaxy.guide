"use client"

import { MDXRemote } from "next-mdx-remote"
import type { RegistryItem } from "../../../../registry/schema"

interface DocExamplesProps {
	item: RegistryItem
}

export function DocExamples({ item }: DocExamplesProps) {
	if (!item?.docs) {
		return null
	}

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold tracking-tight">Examples</h2>
			<div className="prose prose-gray dark:prose-invert max-w-none">
				<MDXRemote source={item.docs} />
			</div>
		</div>
	)
}

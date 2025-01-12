"use client"

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { RegistryItem } from "../../../../registry/schema"

interface DocPropsProps {
	item: RegistryItem
}

interface PropDefinition {
	name: string
	type: string
	defaultValue?: string
	description?: string
	required?: boolean
}

interface PropMatch {
	name: string
	optional?: string
	type: string
	description?: string
}

function extractProps(content: string): PropDefinition[] {
	const props: PropDefinition[] = []
	const interfaceRegex = /interface\s+(\w+Props)\s*{([^}]*)}/g
	const propRegex = /(\w+)(\?)?:\s*([^;\n]+)(?:;\s*\/\/\s*(.+))?/g

	let interfaceMatch: RegExpExecArray | null = null
	let interfaceResult: RegExpExecArray | null = null

	interfaceResult = interfaceRegex.exec(content)
	while (interfaceResult !== null) {
		interfaceMatch = interfaceResult
		const interfaceContent = interfaceMatch[2]
		if (interfaceContent) {
			let propMatch: RegExpExecArray | null = null
			let propResult: RegExpExecArray | null = null

			propResult = propRegex.exec(interfaceContent)
			while (propResult !== null) {
				propMatch = propResult
				const [, name, optional, type, description] = propMatch
				if (name && type) {
					props.push({
						name,
						type: type.trim(),
						description: description?.trim(),
						required: !optional,
					})
				}
				propResult = propRegex.exec(interfaceContent)
			}
		}
		interfaceResult = interfaceRegex.exec(content)
	}

	return props
}

export function DocProps({ item }: DocPropsProps) {
	const content = item.files[0]?.content || ""
	const props = extractProps(content)

	if (props.length === 0) {
		return (
			<div className="space-y-4">
				<h2 className="text-2xl font-bold tracking-tight">Props</h2>
				<p className="text-muted-foreground">No props documentation available.</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold tracking-tight">Props</h2>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[150px]">Name</TableHead>
						<TableHead className="w-[150px]">Type</TableHead>
						<TableHead className="w-[100px]">Required</TableHead>
						<TableHead>Description</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{props.map((prop) => (
						<TableRow key={prop.name}>
							<TableCell className="font-mono">{prop.name}</TableCell>
							<TableCell className="font-mono">{prop.type}</TableCell>
							<TableCell>{prop.required ? "Yes" : "No"}</TableCell>
							<TableCell>{prop.description || "—"}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

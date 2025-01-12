"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { RegistryItem } from "../../../../registry/schema"

interface DocSidebarProps {
	registry: Record<string, RegistryItem[]>
}

export const DocSidebar = ({ registry }: DocSidebarProps) => {
	const pathname = usePathname()

	return (
		<aside className="flex flex-col space-y-4">
			<nav className="sticky top-20">
				<div className="space-y-2">
					{Object.entries(registry).map(([category, items]) => (
						<div key={category} className="space-y-3">
							<h4 className="font-medium text-sm text-muted-foreground">
								{category}
							</h4>
							<div className="grid grid-flow-row auto-rows-max text-sm">
								{items.map((item) => {
									const href = `/ui/docs/${category}/${item.name}`
									const isActive = pathname === href

									return (
										<Link
											key={item.name}
											href={href}
											className={cn(
												"group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline",
												isActive && "font-medium text-foreground"
											)}
										>
											{item.name}
										</Link>
									)
								})}
							</div>
						</div>
					))}
				</div>
			</nav>
		</aside>
	)
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Brain, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AIDemo } from '../layout'

export function CollapsibleSidebar({ demos }: { demos: AIDemo[] }) {
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isHovered, setIsHovered] = useState(false)

	useEffect(() => {
		const savedState = localStorage.getItem('ai-sidebar-collapsed')
		setIsCollapsed(savedState ? JSON.parse(savedState) : false)
	}, [])

	const toggleSidebar = () => {
		const newState = !isCollapsed
		setIsCollapsed(newState)
		localStorage.setItem('ai-sidebar-collapsed', JSON.stringify(newState))
	}

	return (
		<aside
			className={cn(
				'relative flex flex-col h-screen bg-gradient-to-b from-gray-800 to-gray-900 border-r border-gray-700 transition-all duration-300',
				isCollapsed ? 'w-20' : 'w-64'
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<button
				type="button"
				onClick={toggleSidebar}
				aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 ring-2 ring-gray-600 transition-all hover:bg-gray-700"
			>
				{isCollapsed ? (
					<PanelLeftOpen className="h-4 w-4 text-white" />
				) : (
					<PanelLeftClose className="h-4 w-4 text-white" />
				)}
			</button>

			{/* Header */}
			<div className="flex-none p-4">
				<div className="mb-4 flex items-center gap-3">
					<div className="relative">
						<div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 opacity-75 blur" />
						<div className="relative rounded-lg bg-gray-900 p-2">
							<Brain className="h-6 w-6 text-purple-400" />
						</div>
					</div>
					{!isCollapsed && (
						<h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
							AI Lab
						</h1>
					)}
				</div>
			</div>

			{/* Scrollable Navigation */}
			<ScrollArea className="flex-1 px-4">
				<nav className="space-y-2 pb-4">
					{demos.map((demo) => (
						<Link
							key={demo.path}
							href={demo.path}
							className={cn(
								'group flex items-center gap-4 rounded-lg p-3 transition-colors',
								'hover:bg-gray-700/50 hover:shadow-glow hover:shadow-purple-400/20',
								isCollapsed ? 'justify-center' : 'justify-start'
							)}
						>
							<span className="text-2xl flex-none">{demo.icon}</span>
							{(!isCollapsed || isHovered) && (
								<div className={cn('overflow-hidden transition-all', isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100')}>
									<div className="text-sm font-medium text-gray-100">{demo.name}</div>
									<div className="text-xs text-gray-400 line-clamp-1">{demo.description}</div>
								</div>
							)}
						</Link>
					))}
				</nav>
			</ScrollArea>
		</aside>
	)
}

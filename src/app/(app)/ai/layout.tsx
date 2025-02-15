import { ReactNode } from 'react'
import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PanelLeftOpen, PanelLeftClose, Rocket } from 'lucide-react'
import { CollapsibleSidebar } from './_components/collapsible-sidebar'

export interface AIDemo {
	name: string
	path: string
	icon: string
	description: string
}

async function getAIDemos(): Promise<AIDemo[]> {
	const aiDir = path.join(process.cwd(), 'src/app/(app)/ai')
	const dirs = await fs.readdir(aiDir, { withFileTypes: true })

	return dirs
		.filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('_') && !dirent.name.startsWith('.'))
		.map(dirent => ({
			name: formatName(dirent.name),
			path: `/ai/${dirent.name}`,
			icon: getDemoIcon(dirent.name),
			description: `${formatName(dirent.name).toLowerCase()} demo`
		}))
}

function formatName(name: string) {
	return name
		.split(/[-_]/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

function getDemoIcon(name: string) {
	const icons: Record<string, string> = {
		'code-completion': '💻',
		'deepseek-web': '🔍',
		'semantic-search': '🔎',
		'musicgen-web': '🎵',
		'llama-3.2-webgpu': '🦙',
		'phi-3.5-webgpu': 'Φ',
		'janus-webgpu': '🎭',
		'smollm-web': '🤖'
	}
	return icons[name] || '✨'
}

export default async function AILayout({ children }: { children: ReactNode }) {
	const demos = await getAIDemos()

	return (
		<div className="flex h-screen overflow-hidden">
			<CollapsibleSidebar demos={demos} />
			<main className="flex-1 overflow-auto transition-[margin]">
				{children}
			</main>
		</div>
	)
}

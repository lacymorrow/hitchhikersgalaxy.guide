'use client'

import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Terminal as TerminalIcon } from 'lucide-react'
import { type FormEvent, memo, useCallback, useState } from 'react'
import { Terminal } from './terminal'
import type { InstallationProgress } from './types'

interface CustomInstallDialogProps {
	onInstall: (command: string) => void
	installationProgress: InstallationProgress
}

export const CustomInstallDialog = memo(({ onInstall, installationProgress }: CustomInstallDialogProps) => {
	const [open, setOpen] = useState(false)
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)

	const isUrl = useCallback((str: string): boolean => {
		try {
			new URL(str.trim())
			return true
		} catch {
			return false
		}
	}, [])

	const isCommand = useCallback((str: string): boolean => {
		const commandPatterns = [
			/^(npx|pnpm dlx|bunx --bun) shadcn@latest add/,
			/^(npx|pnpm dlx|bunx --bun) shadcn@latest add "https?:\/\/[^"]+"/,
		]
		return commandPatterns.some(pattern => pattern.test(str.trim()))
	}, [])

	const formatUrlToCommand = useCallback((url: string): string => {
		return `npx shadcn@latest add "${url.trim()}"`
	}, [])

	const handleSubmit = useCallback(async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			const trimmedInput = input.trim()
			let finalCommand: string

			if (isUrl(trimmedInput)) {
				finalCommand = formatUrlToCommand(trimmedInput)
			} else if (isCommand(trimmedInput)) {
				finalCommand = trimmedInput
			} else {
				throw new Error('Please enter a valid URL or install command')
			}

			setOpen(false)
			setInput('')
			toast({
				title: "Command accepted",
				description: "Starting installation...",
			})
			await onInstall(finalCommand)
		} catch (error) {
			toast({
				title: "Invalid input",
				description: error instanceof Error ? error.message : "Please check the format",
				variant: "destructive",
			})
		} finally {
			setLoading(false)
		}
	}, [input, isUrl, isCommand, formatUrlToCommand, onInstall])

	const handleOpenChange = useCallback((isOpen: boolean) => {
		if (!loading || !isOpen) {
			setOpen(isOpen)
		}
	}, [loading])

	return (
		<>
			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="default"
						className="w-full justify-start"
						onClick={(e) => {
							e.stopPropagation()
							setOpen(true)
						}}
					>
						<TerminalIcon className="mr-2 h-4 w-4" />
						Install from URL or Command
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[400px] p-4"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="space-y-4">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Install Component</h4>
							<p className="text-sm text-muted-foreground">
								Enter any component URL or install command.
							</p>
						</div>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="input">URL or Command</Label>
								<Input
									id="input"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="npx shadcn@latest add ..."
									required
									disabled={loading}
								/>
								<div className="text-xs text-muted-foreground space-y-1">
									<p>Enter an install command or component URL...</p>
								</div>
							</div>
							<div className="flex justify-end">
								<Button type="submit" disabled={loading}>
									{loading ? (
										<>
											<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
											Installing...
										</>
									) : (
										'Install'
									)}
								</Button>
							</div>
						</form>
					</div>
				</PopoverContent>
			</Popover>

			{/* Installation output overlay */}
			{(installationProgress.status !== 'idle') && (
				<div className="fixed bottom-4 right-4 w-[500px] z-50">
					<div className="bg-[#1E1E1E] rounded-lg shadow-2xl border border-black/10">
						<div className="relative">
							<div className="h-8 bg-[#323233] rounded-t-lg flex items-center justify-between px-3">
								<div className="absolute left-3 flex items-center gap-2 text-xs">
									{installationProgress.status === 'installing' ? (
										<div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full">
											<ReloadIcon className="h-3 w-3 animate-spin" />
											Installing...
										</div>
									) : installationProgress.status === 'success' ? (
										<div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
											<TerminalIcon className="h-3 w-3" />
											Complete
										</div>
									) : (
										<div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 text-red-400 rounded-full">
											<TerminalIcon className="h-3 w-3" />
											Error
										</div>
									)}
								</div>
								<span className="w-full text-center text-xs text-zinc-400 font-medium">
									Console Output
								</span>
							</div>
							<div className="pt-8">
								{installationProgress.log ? (
									<Terminal
										output={installationProgress.log.split('\n')}
										className="h-[300px] rounded-b-lg"
									/>
								) : (
									<div className="h-[300px] flex items-center justify-center text-zinc-400">
										<ReloadIcon className="h-6 w-6 animate-spin" />
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
})
CustomInstallDialog.displayName = 'CustomInstallDialog'

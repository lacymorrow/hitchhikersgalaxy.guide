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
import { Terminal } from 'lucide-react'
import { type FormEvent, useState } from 'react'

interface CustomInstallDialogProps {
	onInstall: (command: string) => void
}

export function CustomInstallDialog({ onInstall }: CustomInstallDialogProps) {
	const [open, setOpen] = useState(false)
	const [input, setInput] = useState('')
	const [loading, setLoading] = useState(false)

	const isUrl = (str: string): boolean => {
		try {
			// Try to construct a URL - this validates the format
			new URL(str.trim())
			return true
		} catch {
			return false
		}
	}

	const isCommand = (str: string): boolean => {
		// Check if the string is a valid shadcn command
		const commandPatterns = [
			/^(npx|pnpm dlx|bunx --bun) shadcn@latest add/,
			/^(npx|pnpm dlx|bunx --bun) shadcn@latest add "https?:\/\/[^"]+"/,
		]
		return commandPatterns.some(pattern => pattern.test(str.trim()))
	}

	const formatUrlToCommand = (url: string): string => {
		return `npx shadcn@latest add "${url.trim()}"`
	}

	const handleSubmit = async (e: FormEvent) => {
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

			await onInstall(finalCommand)
			setOpen(false)
			setInput('')
			toast({
				title: "Command accepted",
				description: "Starting installation...",
			})
		} catch (error) {
			toast({
				title: "Invalid input",
				description: error instanceof Error ? error.message : "Please check the format",
				variant: "destructive",
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
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
					<Terminal className="mr-2 h-4 w-4" />
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
	)
}

'use client'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { LOCAL_STORAGE_KEYS } from '@/config/local-storage-keys'
import { routes } from '@/config/routes'
import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import React, { useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

const builtByVariants = cva(
	'fixed z-50 flex items-center justify-between text-sm animate-in fade-in-0 transition-opacity duration-500 delay-1000',
	{
		variants: {
			variant: {
				banner: 'inset-x-0 bottom-0 p-4 bg-primary text-primary-foreground',
				popover: 'bottom-md right-md max-w-sm rounded-lg shadow-lg',
			},
		},
		defaultVariants: {
			variant: 'banner',
		},
	}
)

export interface AttributionProps
	extends React.HTMLAttributes<HTMLDivElement>,
	VariantProps<typeof builtByVariants> {
	title?: string
	description?: string
	onClose?: () => void
	open?: boolean
}

export function Attribution({
	className,
	variant = 'banner',
	title = 'Built with Shipkit',
	description = 'The ultimate Next.js starter kit for your project',
	onClose,
	open = true,
	...props
}: AttributionProps) {
	const [wasClosed, setWasClosed] = useLocalStorage(LOCAL_STORAGE_KEYS.attributionClosed, false)
	const [isOpen, setIsOpen] = useState(wasClosed ? false : open)

	const handleClose = () => {
		setIsOpen(false)
		setWasClosed(true)
		onClose?.()
	}

	const Content = () => (
		<>
			<div>
				<h3 className="font-semibold">{title}</h3>
				<p className="text-xs">{description}</p>
			</div>
			{onClose && (
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					onClick={handleClose}
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</Button>
			)}
		</>
	)

	if (variant === 'banner' && isOpen) {
		return (
			<div className={cn(builtByVariants({ variant }), className)} {...props}>
				<div className="container flex items-center justify-between">
					<Content />
					<button onClick={handleClose} type="button" className="absolute top-2 right-2"><X className="h-4 w-4" /></button>
				</div>
			</div>
		)
	}

	if (variant === 'popover' && isOpen) {
		return (
			<Card className={cn(builtByVariants({ variant }), className)} {...props}>
				<button onClick={handleClose} type="button" className="absolute top-2 right-2"><X className="h-4 w-4" /></button>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent className="flex gap-2 justify-end mt-auto">
					<Button
						className="w-full"
						variant="outline"
						onClick={() => window.open(routes.external.shipkit, '_blank')}
					>
						More...
					</Button>
				</CardContent>
			</Card>
		)
	}

	return null
}


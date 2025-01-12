"use client"

import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import * as React from "react"

interface DocPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
	component: string
	library?: string
	previewPath?: string
}

type DynamicComponent = React.ComponentType | null

export function DocPreview({ previewPath, component, library = "shadcn", className, ...props }: DocPreviewProps) {
	const [Preview, setPreview] = React.useState<DynamicComponent>(null)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		const loadPreview = async () => {
			try {
				const source = previewPath ?? `@/app/ui/registry/src/components/ui/${library}/${component}.preview`
				if (!source) {
					setError(`No preview available for ${previewPath}`)
					return
				}

				// Use a more webpack-friendly dynamic import approach
				let PreviewComponent: DynamicComponent
				try {
					// Handle the default preview path case
					if (!previewPath) {
						PreviewComponent = dynamic(
							() => import(source).catch((err) => {
								console.warn(`Could not load preview for ${component}`, err)
								return () => null
							}),
							{
								loading: () => (
									<div className="flex min-h-[350px] items-center justify-center text-sm text-muted-foreground">
										Loading preview...
									</div>
								),
								ssr: false,
							}
						)
					} else {
						// Handle custom preview paths
						PreviewComponent = dynamic(
							() => import(previewPath).catch((err) => {
								console.warn(`Could not load custom preview at ${previewPath}`, err)
								return () => null
							}),
							{
								loading: () => (
									<div className="flex min-h-[350px] items-center justify-center text-sm text-muted-foreground">
										Loading preview...
									</div>
								),
								ssr: false,
							}
						)
					}

					setPreview(() => PreviewComponent)
				} catch (err) {
					console.error('Failed to load preview:', err)
					setError('Failed to load preview component')
				}
			} catch (err) {
				console.error(`Failed to load preview for ${previewPath}:`, err)
				setError(`No preview available for ${previewPath}`)
			}
		}

		loadPreview()
	}, [previewPath, component, library])

	return (
		<div className={cn("relative rounded-lg border bg-background", className)} {...props}>
			<div className="p-6">
				{error ? (
					<div className="flex min-h-[350px] items-center justify-center text-sm text-muted-foreground">
						{error}
					</div>
				) : !Preview ? (
					<div className="flex min-h-[350px] items-center justify-center text-sm text-muted-foreground">
						Loading preview...
					</div>
				) : (
					<div className="flex min-h-[350px] items-center justify-center">
						<Preview />
					</div>
				)}
			</div>
		</div>
	)
}

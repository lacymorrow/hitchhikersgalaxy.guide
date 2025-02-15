"use client"

import { Button } from "@/components/ui/button"

export default function ButtonPreview() {
	return (
		<div className="flex flex-col gap-4">
			{/* Default Variants */}
			<div className="flex flex-wrap gap-4">
				<Button>Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="link">Link</Button>
			</div>

			{/* Sizes */}
			<div className="flex flex-wrap items-center gap-4">
				<Button size="sm">Small</Button>
				<Button>Default</Button>
				<Button size="lg">Large</Button>
				<Button size="icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						className="h-4 w-4"
						aria-hidden="true"
						role="img"
						aria-label="Add"
					>
						<path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
					</svg>
				</Button>
			</div>

			{/* States */}
			<div className="flex flex-wrap gap-4">
				<Button disabled>Disabled</Button>
				<Button disabled aria-label="Loading">Loading...</Button>
			</div>
		</div>
	)
}

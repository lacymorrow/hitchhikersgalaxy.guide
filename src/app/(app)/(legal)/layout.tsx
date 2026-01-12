import { Header } from "@/components/headers/header"
import { routes } from "@/config/routes"
import type { ReactNode } from "react"

const navLinks = [
	{ href: routes.home, label: "Home" },
	{ href: routes.privacy, label: "Privacy Policy" },
	{ href: routes.terms, label: "Terms of Service" },
]

interface DocsLayoutProps {
	children: ReactNode
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
	return (
		<>
			<Header navLinks={navLinks} />
			<div className="container mx-auto w-full min-w-0 prose dark:prose-invert my-header">

				{/* Content */}
				{children}

			</div>
		</>
	)
}

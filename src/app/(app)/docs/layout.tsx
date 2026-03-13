import type { ReactNode } from "react";
import { Header } from "@/components/headers/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDocsNavigation } from "@/lib/docs";
import { DocsSidebar } from "./_components/docs-sidebar";
import "./styles.css";
import { routes } from "@/config/routes";

interface DocsLayoutProps {
	children: ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
	const navigation = await getDocsNavigation();
	const navLinks = [
		{ href: routes.docs, label: "Docs" },
		{ href: routes.features, label: "Features" },
		{ href: routes.pricing, label: "Pricing" },
	];

	return (
		<>
			<Header
				navLinks={navLinks}
				variant="sticky"
				searchVariant="menu"
				searchPlaceholder="Search Shipkit or press ⌘K"
			/>
			<div className="container mx-auto flex-1 items-start gap-6 py-6 lg:py-8 md:grid md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_260px]">
				{/* Sidebar */}
				<aside className="hidden md:block">
					<div className="sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-4">
						<ScrollArea className="h-full">
							<div className="pb-8">
								<DocsSidebar navigation={navigation} />
							</div>
						</ScrollArea>
					</div>
				</aside>

				{/* Main content */}
				<main className="relative min-w-0">
					{children}
				</main>

				{/* Right rail is provided by the docs page (table of contents) */}
			</div>
		</>
	);
}

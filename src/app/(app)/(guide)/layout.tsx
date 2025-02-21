import { ShareButton } from "@/components/buttons/share-button";
import { Link } from "@/components/primitives/link-with-transition";
import { Home } from "lucide-react";
import { GuideSearchServer } from "./_components/guide-search-server";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";

export default function GuideLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Header with navigation */}
			<header className="sticky top-0 z-50 border-b border-green-500/20 bg-black/80 backdrop-blur">
				<div className="container max-w-4xl mx-auto flex h-14 items-center justify-between gap-6">
					<div className="flex gap-4 lg:gap-8">

						<Link
							href="/"
							className="flex items-center gap-2 font-mono text-green-500 transition-colors hover:text-green-400"
						>
							<Home className="h-5 w-5" />
							<span className="hidden sm:inline-block">The Guide</span>
						</Link>

						<nav className="flex items-center gap-4">
							<Link
								href="/popular"
								className="font-mono text-sm text-green-500/80 transition-colors hover:text-green-500"
							>
								Popular
							</Link>
							<Link
								href="/submit"
								className="font-mono text-sm text-green-500/80 transition-colors hover:text-green-500"
							>
								Submit Entry
							</Link>
							<Link
								href="/about"
								className="font-mono text-sm text-green-500/80 transition-colors hover:text-green-500"
							>
								About
							</Link>
						</nav>
					</div>

					<Suspense fallback={<SuspenseFallback />}>
						<GuideSearchServer searchTerm="" />
					</Suspense>

				</div>
			</header>

			<main className="flex-1">
				{children}
			</main>

			{/* Footer */}
			<footer className="relative overflow-hidden py-2 pb-12">
				<div className="container flex items-center justify-center gap-2 font-mono text-sm text-green-500/40">
					<ShareButton title="The Hitchhiker's Guide to the Galaxy" variant="subtle" />
					<span>- Sirius Cybernetics Corporation</span>
				</div>
			</footer>
		</div>
	);
}

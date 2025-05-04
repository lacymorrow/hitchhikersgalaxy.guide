import { ShareButton } from "@/components/buttons/share-button";
import { Link } from "@/components/primitives/link-with-transition";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { Suspense } from "react";
import { GuideSearchServer } from "./_components/guide-search-server";

export default function GuideLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col">
			{/* Header with navigation */}
			<header className="sticky top-0 z-50 border-b border-[#70c8cd]/20 bg-black/80 backdrop-blur">
				<div className="container max-w-4xl mx-auto flex h-14 items-center justify-between gap-6">
					<div className="flex gap-4 lg:gap-8">

						<Link
							href="/"
							className="flex items-center gap-2 font-mono text-[#70c8cd] transition-colors hover:text-[#70c8cd]/80"
						>
							<div className="relative h-5 w-5" style={{
								backgroundColor: "currentColor",
								maskImage: "url(/logo.png)",
								maskSize: "contain",
								maskRepeat: "no-repeat",
								maskPosition: "center",
								WebkitMaskImage: "url(/logo.png)",
								WebkitMaskSize: "contain",
								WebkitMaskRepeat: "no-repeat",
								WebkitMaskPosition: "center",
							}} />
							<span className="hidden sm:inline-block">The Guide</span>
						</Link>

						<nav className="flex items-center gap-4">
							<Link
								href="/popular"
								className="font-mono text-sm text-[#70c8cd]/80 transition-colors hover:text-[#70c8cd]"
							>
								Popular
							</Link>
							<Link
								href="/submit"
								className="font-mono text-sm text-[#70c8cd]/80 transition-colors hover:text-[#70c8cd]"
							>
								Submit Entry
							</Link>
							<Link
								href="/about"
								className="font-mono text-sm text-[#70c8cd]/80 transition-colors hover:text-[#70c8cd]"
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
				<div className="container flex items-center justify-center gap-2 font-mono text-sm text-[#70c8cd]/40">
					<ShareButton title="The Hitchhiker's Guide to the Galaxy" variant="subtle" />
					<span>- Sirius Cybernetics Corporation</span>
				</div>
			</footer>
		</div>
	);
}

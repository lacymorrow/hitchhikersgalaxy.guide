import { FadeIn } from "@/components/animations/fade-in";
import { ShareButton } from "@/components/buttons/share-button";
import { Link } from "@/components/primitives/link-with-transition";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { Button } from "@/components/ui/button";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { BookOpen, Info, MapIcon } from "lucide-react";
import { Suspense } from "react";
import { GuideSearchInlineServer } from "./_components/guide-search-inline-server";
import { RecentEntries } from "./_components/recent-entries";

export const dynamic = 'force-dynamic';

export default function GuidePage() {
	return (
		<div className="container relative max-w-6xl py-6 lg:py-10">
			{/* Main content container */}
			<div className="flex flex-col space-y-8">
				{/* Logo and title section */}
				<FadeIn delay={100} duration={600}>
					<div className="flex flex-col items-center space-y-6 text-center">
						{/* Logo */}
						<div
							className="relative h-36 w-36 mb-2"
							style={{
								backgroundColor: "#70c8cd",
								maskImage: "url(/logo.png)",
								maskSize: "contain",
								maskRepeat: "no-repeat",
								maskPosition: "center",
								WebkitMaskImage: "url(/logo.png)", // Vendor prefix for Safari
								WebkitMaskSize: "contain",
								WebkitMaskRepeat: "no-repeat",
								WebkitMaskPosition: "center",
							}}
						>
							{/* Image removed, using div background and mask */}
						</div>

						<h2 className="font-mono text-5xl font-bold text-[#70c8cd] sm:text-6xl md:text-7xl lg:text-8xl mt-8">
							DON'T PANIC
						</h2>

						<p className="max-w-[42rem] text-[#70c8cd]/80 sm:text-lg sm:leading-8 mt-4">
							The standard repository of all knowledge and wisdom. An
							indispensable companion for all hitchhikers in the universe.
						</p>
					</div>
				</FadeIn>

				{/* Main search interface */}
				<FadeIn delay={300} duration={600}>
					<div className="mx-auto w-full max-w-2xl mt-12">
						{/* Replace the static input with the functional component */}
						<Suspense fallback={<SuspenseFallback />}>
							<GuideSearchInlineServer />
						</Suspense>
					</div>
				</FadeIn>

				{/* Recent searches - can be removed or kept depending on future features */}
				<FadeIn delay={500} duration={600} className="hidden">
					<div className="mt-12">
						<h2 className="font-mono text-2xl font-bold text-[#70c8cd] mb-6">
							RECENT SEARCHES
						</h2>
						<div className="flex flex-col space-y-4">
							<div className="border-2 border-[#70c8cd]/30 rounded-md p-4 hover:bg-[#70c8cd]/5 cursor-pointer">
								<p className="font-mono text-xl text-[#70c8cd]">Vogons</p>
							</div>
							<div className="border-2 border-[#70c8cd]/30 rounded-md p-4 hover:bg-[#70c8cd]/5 cursor-pointer">
								<p className="font-mono text-xl text-[#70c8cd]">The Answer to the Ultimate Question</p>
							</div>
							<div className="border-2 border-[#70c8cd]/30 rounded-md p-4 hover:bg-[#70c8cd]/5 cursor-pointer">
								<p className="font-mono text-xl text-[#70c8cd]">Infinite Improbability Drive</p>
							</div>
							<div className="border-2 border-[#70c8cd]/30 rounded-md p-4 hover:bg-[#70c8cd]/5 cursor-pointer">
								<p className="font-mono text-xl text-[#70c8cd]">Pan Galactic Gargle Blaster</p>
							</div>
						</div>
					</div>
				</FadeIn>

				{/* Navigation buttons */}
				<FadeIn delay={500} duration={600}>
					<div className="mx-auto flex flex-wrap justify-center gap-4">
						<Link href="/travel-guide">
							<Button
								variant="outline"
								className="border-[#70c8cd] text-[#70c8cd] hover:bg-[#70c8cd]/10"
							>
								<MapIcon className="mr-2 h-4 w-4" />
								Travel Guide
							</Button>
						</Link>
						<Link href="/popular">
							<Button
								variant="outline"
								className="border-[#70c8cd] text-[#70c8cd] hover:bg-[#70c8cd]/10"
							>
								<StarFilledIcon className="mr-2 h-4 w-4" />
								Popular Entries
							</Button>
						</Link>
						<Link href="/submit">
							<Button
								variant="outline"
								className="border-[#70c8cd] text-[#70c8cd] hover:bg-[#70c8cd]/10"
							>
								<BookOpen className="mr-2 h-4 w-4" />
								Submit Entry
							</Button>
						</Link>
						<Link href="/about">
							<Button
								variant="outline"
								className="border-[#70c8cd] text-[#70c8cd] hover:bg-[#70c8cd]/10"
							>
								<Info className="mr-2 h-4 w-4" />
								About the Guide
							</Button>
						</Link>
					</div>
				</FadeIn>

				{/* Recent entries section */}
				<FadeIn delay={700} duration={600}>
					<div className="mt-12">
						<div className="mb-8 flex items-center justify-between">
							<h2 className="font-mono text-2xl font-bold text-[#70c8cd]">
								Recent Entries
							</h2>
							<ShareButton title="The Hitchhiker's Guide to the Galaxy" />
						</div>
						<div className="min-h-[200px]">
							<Suspense
								fallback={
									<SuspenseFallback height="200px" />
								}
							>
								<RecentEntries />
							</Suspense>
						</div>
					</div>
				</FadeIn>
			</div>
		</div>
	);
}

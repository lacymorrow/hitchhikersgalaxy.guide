import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { Button } from "@/components/ui/button";
import { BookOpen, Info, MapIcon } from "lucide-react";
import { Suspense } from "react";
import { RecentEntries } from "./_components/recent-entries";
import { ShareButton } from "@/components/buttons/share-button";
import { Link } from "@/components/primitives/link-with-transition";
import { StarFilledIcon } from "@radix-ui/react-icons";
import { GuideSearchInlineServer } from "./_components/guide-search-inline-server";
import { Card } from "@/components/ui/card";

export default function GuidePage() {
	return (
		<div className="container relative max-w-6xl py-6 lg:py-10">
			{/* Electronic book frame */}
			<div className="relative rounded-lg border-4 border-green-500 bg-black p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
				{/* Screen interface */}
				<div className="flex flex-col space-y-8">
					{/* Header */}
					<div className="flex flex-col items-center space-y-4 text-center">
						<h1 className="font-mono text-4xl font-bold text-green-500 sm:text-5xl md:text-6xl lg:text-7xl">
							DON'T PANIC
						</h1>
						<p className="max-w-[42rem] font-mono leading-normal text-green-400/80 sm:text-xl sm:leading-8">
							Welcome to the Hitchhiker's Guide to the Galaxy, the most
							remarkable book ever to come out of the great publishing
							corporations of Ursa Minor.
						</p>
					</div>

					{/* Main search interface */}
					<div className="mx-auto w-full max-w-2xl">
						<Card className="border-green-500/20 bg-black p-4">
							<div className="flex flex-col items-center gap-4">
								<p className="text-center font-mono text-sm text-green-400/60">
									Type your query below to search the Guide
								</p>
								<div className="w-full">
									<Suspense fallback={<SuspenseFallback />}>
										<GuideSearchInlineServer />
									</Suspense>
								</div>
								<p className="text-center font-mono text-sm text-green-400/60">
									Search for anything in the known (and several unknown) universes
								</p>
							</div>
						</Card>
					</div>

					{/* Navigation buttons */}
					<div className="mx-auto flex flex-wrap justify-center gap-4">
						<Link href="/travel-guide">
							<Button
								variant="outline"
								className="border-green-500 text-green-500 hover:bg-green-500/10"
							>
								<MapIcon className="mr-2 h-4 w-4" />
								Travel Guide
							</Button>
						</Link>
						<Link href="/popular">
							<Button
								variant="outline"
								className="border-green-500 text-green-500 hover:bg-green-500/10"
							>
								<StarFilledIcon className="mr-2 h-4 w-4" />
								Popular Entries
							</Button>
						</Link>
						<Link href="/submit">
							<Button
								variant="outline"
								className="border-green-500 text-green-500 hover:bg-green-500/10"
							>
								<BookOpen className="mr-2 h-4 w-4" />
								Submit Entry
							</Button>
						</Link>
						<Link href="/about">
							<Button
								variant="outline"
								className="border-green-500 text-green-500 hover:bg-green-500/10"
							>
								<Info className="mr-2 h-4 w-4" />
								About the Guide
							</Button>
						</Link>
					</div>

					{/* Recent entries section */}
					<div className="mt-12">
						<div className="mb-8 flex items-center justify-between">
							<h2 className="font-mono text-2xl font-bold text-green-500">
								Recent Entries
							</h2>
							<ShareButton title="The Hitchhiker's Guide to the Galaxy" />
						</div>
						<Suspense
							fallback={
								<div className="text-center text-green-500/60">
									Loading entries from across the galaxy...
								</div>
							}
						>
							<RecentEntries />
						</Suspense>
					</div>
				</div>
			</div>
		</div>
	);
}

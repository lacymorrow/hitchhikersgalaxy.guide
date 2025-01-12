import { Button } from "@/components/ui/button";
import { BookOpen, Info, MapIcon, Star } from "lucide-react";
import { Suspense } from "react";
import { GuideSearchServer } from "./_components/guide-search-server";
import { RecentEntries } from "./_components/recent-entries";

export const metadata = {
	title: "The Hitchhiker's Guide to the Galaxy",
	description:
		"The most remarkable book ever to come out of the great publishing corporations of Ursa Minor.",
};

export default function GuidePage() {
	return (

		<div className="container relative min-h-screen max-w-6xl py-6 lg:py-10">
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

					{/* Main interface */}
					<div className="mx-auto mt-6 w-full max-w-2xl">
						<GuideSearchServer searchTerm="hello" />
					</div>

					{/* Navigation buttons */}
					<div className="mx-auto flex flex-wrap justify-center gap-4">
						<Button
							variant="outline"
							className="border-green-500 text-green-500 hover:bg-green-500/10"
						>
							<MapIcon className="mr-2 h-4 w-4" />
							Travel Guide
						</Button>
						<Button
							variant="outline"
							className="border-green-500 text-green-500 hover:bg-green-500/10"
						>
							<Star className="mr-2 h-4 w-4" />
							Popular Entries
						</Button>
						<Button
							variant="outline"
							className="border-green-500 text-green-500 hover:bg-green-500/10"
						>
							<BookOpen className="mr-2 h-4 w-4" />
							Submit Entry
						</Button>
						<Button
							variant="outline"
							className="border-green-500 text-green-500 hover:bg-green-500/10"
						>
							<Info className="mr-2 h-4 w-4" />
							About the Guide
						</Button>
					</div>

					{/* Recent entries section */}
					<div className="mt-12">
						<h2 className="mb-8 font-mono text-2xl font-bold text-green-500">
							Recent Entries
						</h2>
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

			{/* Easter egg: A subtle "Share & Enjoy" footer */}
			<div className="mt-8 text-center font-mono text-sm text-green-500/40">
				Share & Enjoy - Sirius Cybernetics Corporation
			</div>
		</div>
	);
}

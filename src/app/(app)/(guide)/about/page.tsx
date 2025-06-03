import { HeartFilledIcon, StarFilledIcon } from "@radix-ui/react-icons";
import { Info, Rocket } from "lucide-react";

export default function AboutPage() {
	return (
		<div className="container relative min-h-screen max-w-6xl py-6 lg:py-10">
			{/* Electronic book frame */}
			<div className="relative rounded-lg border-4 border-blue-500 bg-black p-6 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
				{/* Screen interface */}
				<div className="flex flex-col space-y-8">
					{/* Header */}
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex items-center space-x-2">
							<Info className="h-8 w-8 text-blue-500" />
							<h1 className="font-mono text-4xl font-bold text-blue-500">
								About the Guide
							</h1>
						</div>
						<p className="max-w-[42rem] font-mono leading-normal text-blue-400/80 sm:text-xl sm:leading-8">
							The Hitchhiker's Guide to the Galaxy has this to say about itself...
						</p>
					</div>

					{/* Main content */}
					<div className="space-y-8 font-mono text-blue-400/80">
						<section className="space-y-4">
							<h2 className="flex items-center gap-2 text-2xl font-bold text-blue-500">
								<StarFilledIcon className="h-6 w-6" />
								What is the Guide?
							</h2>
							<p>
								The Hitchhiker's Guide to the Galaxy is the most remarkable,
								certainly the most successful book ever to come out of the great
								publishing corporations of Ursa Minor. More popular than the
								Celestial Home Care Omnibus, better selling than Fifty-Three More
								Things to do in Zero Gravity, and more controversial than Oolon
								Colluphid's trilogy of philosophical blockbusters.
							</p>
						</section>

						<section className="space-y-4">
							<h2 className="flex items-center gap-2 text-2xl font-bold text-blue-500">
								<Rocket className="h-6 w-6" />
								How Does it Work?
							</h2>
							<p>
								The Guide is an infinite improbability device that harnesses the
								power of the Babel fish to translate the collective knowledge of
								the galaxy into something approaching comprehensibility. It employs
								a sophisticated search algorithm based on the principles of
								bistromathics and the fundamental interconnectedness of all
								things.
							</p>
							<p>
								Users can search for any topic in the known (and several unknown)
								universes, and the Guide will provide a mostly harmless summary of
								what it knows about the subject. The accuracy of these entries
								ranges from "mostly accurate" to "mostly harmless" to "wildly
								inaccurate but significantly more interesting than the truth."
							</p>
						</section>

						<section className="space-y-4">
							<h2 className="flex items-center gap-2 text-2xl font-bold text-blue-500">
								<HeartFilledIcon className="h-6 w-6" />
								Contributing to the Guide
							</h2>
							<p>
								The Guide is always looking for new entries from field researchers
								across the galaxy. Whether you've discovered a new form of life in
								the horse head nebula, found the perfect Pan Galactic Gargle
								Blaster recipe, or just want to share your thoughts on the
								meaning of life (spoiler: it's 42), we welcome your
								contributions.
							</p>
							<p>
								Remember: DON'T PANIC, and always carry a towel. The Guide is
								your friend in an unfriendly universe, your companion in the vast
								expanse of space, and most importantly, cheaper than the
								Encyclopedia Galactica.
							</p>
						</section>

						<div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-6">
							<p className="text-center text-sm italic">
								"In many of the more relaxed civilizations on the Outer Eastern
								Rim of the Galaxy, the Hitchhiker's Guide has already supplanted
								the great Encyclopedia Galactica as the standard repository of all
								knowledge and wisdom, for though it has many omissions and
								contains much that is apocryphal, or at least wildly inaccurate,
								it scores over the older, more pedestrian work in two important
								respects..."
							</p>
							<p className="mt-4 text-center text-sm font-bold text-blue-500">
								First, it's slightly cheaper; and second, it has the words "DON'T
								PANIC" inscribed in large friendly letters on its cover.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

import { MapIcon, AlertTriangle, Rocket, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartFilledIcon } from "@radix-ui/react-icons";

export default function TravelGuidePage() {
	return (
		<div className="container relative min-h-screen max-w-6xl py-6 lg:py-10">
			{/* Electronic book frame */}
			<div className="relative rounded-lg border-4 border-green-500 bg-black p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
				{/* Screen interface */}
				<div className="flex flex-col space-y-8">
					{/* Header */}
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex items-center space-x-2">
							<MapIcon className="h-8 w-8 text-green-500" />
							<h1 className="font-mono text-4xl font-bold text-green-500">
								Travel Guide
							</h1>
						</div>
						<p className="max-w-[42rem] font-mono leading-normal text-green-400/80 sm:text-xl sm:leading-8">
							Essential information for any hitchhiker traversing the galaxy.
							Remember: DON'T PANIC, and always know where your towel is.
						</p>
					</div>

					{/* Main content */}
					<div className="grid gap-6 md:grid-cols-2">
						<Card className="border-green-500/20 bg-black">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-green-500">
									<AlertTriangle className="h-5 w-5" />
									Essential Items
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 font-mono text-green-400/80">
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										1. Your Towel
									</h3>
									<p>
										The most massively useful thing an interstellar hitchhiker
										can have. Use it for warmth, as a weapon, wet it for hand-
										to-hand combat, wrap it around your head to ward off noxious
										fumes, and of course, dry yourself off with it if it still
										seems to be clean enough.
									</p>
								</div>
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										2. Electronic Thumb
									</h3>
									<p>
										A more sophisticated version of the traditional thumb -
										essential for signaling passing spacecraft for a lift.
									</p>
								</div>
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										3. Babel Fish
									</h3>
									<p>
										Small, yellow, leech-like fish that feeds on brain wave
										energy. Pop it in your ear to understand any language in the
										galaxy.
									</p>
								</div>
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										4. Nutrimatic Drink Dispenser
									</h3>
									<p>
										Produces a liquid that is almost, but not quite, entirely
										unlike tea. Better than nothing in a pinch.
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border-green-500/20 bg-black">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-green-500">
									<Rocket className="h-5 w-5" />
									Travel Tips
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 font-mono text-green-400/80">
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										1. Hitching Etiquette
									</h3>
									<p>
										Always smile at the driver. This may be difficult if they
										have just rescued you from the vacuum of space where you've
										been floating for thirty seconds. But a smile is important in
										these situations.
									</p>
								</div>
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										2. Space Travel
									</h3>
									<p>
										The secret to flying is to throw yourself at the ground and
										miss. The knack lies in learning how to throw yourself at
										the ground and miss.
									</p>
								</div>
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										3. Local Customs
									</h3>
									<p>
										When visiting Squornshellous Zeta, always compliment the
										mattresses on their bounciness. When dining at Milliways,
										remember to meet your meat.
									</p>
								</div>
								<div>
									<h3 className="mb-2 font-bold text-green-500">
										4. Time Travel
									</h3>
									<p>
										Avoid if possible. If unavoidable, never meet yourself and
										remember that most problems are caused by people being where
										they shouldn't be, when they shouldn't be there.
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="border-green-500/20 bg-black md:col-span-2">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-green-500">
									<HeartFilledIcon className="h-5 w-5" />
									Important Notes
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 font-mono text-green-400/80">
								<div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
									<p className="text-center text-sm">
										"Space," says the Guide, "is big. Really big. You just
										won't believe how vastly, hugely, mind-bogglingly big it
										is. I mean, you may think it's a long way down the road to
										the chemist, but that's just peanuts to space."
									</p>
								</div>
								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<h3 className="mb-2 font-bold text-green-500">
											Emergency Procedures
										</h3>
										<p>
											In case of emergency, follow these steps:
											<br />1. Don't Panic
											<br />2. Locate your towel
											<br />3. Check your Babel fish is secure
											<br />4. Consult the Guide
											<br />5. If all else fails, panic
										</p>
									</div>
									<div>
										<h3 className="mb-2 font-bold text-green-500">
											Final Advice
										</h3>
										<p>
											The Answer to the Ultimate Question of Life, the Universe,
											and Everything is 42. Unfortunately, we're still not sure
											what the Question is. In the meantime, try to enjoy your
											journey through this amazingly improbable universe.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
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

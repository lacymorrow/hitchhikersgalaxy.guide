"use client";

import { Player } from "@remotion/player";
import { BeamOfLight } from "../components/primitives/beam-of-light";

export default function Page() {
	return (
		<>
			<Player
				component={BeamOfLight}
				durationInFrames={120}
				compositionWidth={1920}
				compositionHeight={1080}
				fps={30}
				controls
				loop
				style={{
					width: 1280,
					height: 720,
				}}
				autoPlay
			/>
		</>
	);
}

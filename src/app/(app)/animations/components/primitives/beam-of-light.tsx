"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const BeamOfLight = () => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	// Calculate the beam height based on the current frame
	const beamHeight = interpolate(frame, [0, durationInFrames], [0, 600]);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			{/* Background planet */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: "50%",
					transform: "translateX(-50%)",
					width: "200px",
					height: "200px",
					borderRadius: "50%",
					background: "radial-gradient(circle, #1e1e1e 0%, #3e3e3e 100%)",
				}}
			/>
			{/* Beam of light */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: "50%",
					transform: "translateX(-50%)",
					width: "10px",
					height: `${beamHeight}px`,
					background:
						"linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)",
					opacity: 0.8,
				}}
			/>
		</div>
	);
};

export const beamOfLightMetadata = {
	id: "beam-of-light",
	title: "Beam of Light",
	description: "A simple beam of light animation with a planet",
	category: "primitives" as const,
	duration: 4,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date("2023-11-27"),
	updatedAt: new Date("2023-11-27"),
};

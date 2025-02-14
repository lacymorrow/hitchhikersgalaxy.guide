"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // 1s for initial state
	INPUT: [31, 60], // 1s for input animation
	PROCESSING: [61, 90], // 1s for processing
	TOKEN: [91, 120], // 1s for token generation
	SUCCESS: [121, 150], // 1s for success state
} as const;

export const LoginFlow = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Calculate progress for each stage
	const inputProgress = interpolate(frame, STAGES.INPUT, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const processingProgress = interpolate(frame, STAGES.PROCESSING, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const tokenProgress = interpolate(frame, STAGES.TOKEN, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const successProgress = interpolate(frame, STAGES.SUCCESS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-[80%] min-w-[1000px] max-w-[1600px] rounded-2xl border-2 bg-card p-16 shadow-xl">
					{/* Login Form */}
					<div className="space-y-12">
						<h2 className="text-6xl font-bold text-foreground">Login</h2>

						{/* Email Input */}
						<div
							className="space-y-6 opacity-0"
							style={{
								opacity: inputProgress,
								transform: `translateY(${20 - inputProgress * 20}px)`,
							}}
						>
							<label className="text-3xl text-muted-foreground">Email</label>
							<div className="h-24 rounded-xl border-2 bg-input px-8" />
						</div>

						{/* Password Input */}
						<div
							className="space-y-6 opacity-0"
							style={{
								opacity: inputProgress,
								transform: `translateY(${20 - inputProgress * 20}px)`,
							}}
						>
							<label className="text-3xl text-muted-foreground">Password</label>
							<div className="h-24 rounded-xl border-2 bg-input px-8" />
						</div>

						{/* Processing Indicator */}
						{processingProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: processingProgress }}
							>
								<div className="h-16 w-16 animate-spin rounded-full border-8 border-primary border-t-transparent" />
							</div>
						)}

						{/* Token Generation */}
						{tokenProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: tokenProgress }}
							>
								<div className="space-y-4 text-center">
									<div className="text-4xl font-semibold text-primary">
										Generating Token
									</div>
									<div className="text-2xl text-muted-foreground">
										Securing your session...
									</div>
								</div>
							</div>
						)}

						{/* Success State */}
						{successProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: successProgress }}
							>
								<div className="space-y-4 text-center">
									<div className="text-7xl text-green-500">✓</div>
									<div className="text-4xl font-semibold text-primary">
										Welcome Back!
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export const loginFlowMetadata: AnimationMetadata = {
	id: "login-flow",
	title: "Login Flow",
	description:
		"Visualization of a secure login process including token generation",
	category: "auth",
	duration: 5,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};

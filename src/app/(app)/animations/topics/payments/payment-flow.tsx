"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	CARD_INPUT: [31, 90], // Card input animation
	VALIDATION: [91, 150], // Card validation
	PROCESSING: [151, 210], // Payment processing
	SUCCESS: [211, 270], // Success state
} as const;

export const PaymentFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const cardProgress = interpolate(frame, STAGES.CARD_INPUT, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const validationProgress = interpolate(frame, STAGES.VALIDATION, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const processingProgress = interpolate(frame, STAGES.PROCESSING, [0, 1], {
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
					<div className="space-y-12">
						<h2 className="text-6xl font-bold text-foreground">Payment</h2>

						{/* Card Details */}
						<div
							className="space-y-6 opacity-0"
							style={{
								opacity: cardProgress,
								transform: `translateY(${20 - cardProgress * 20}px)`,
							}}
						>
							<label className="text-3xl text-muted-foreground">
								Card Number
							</label>
							<div className="h-24 rounded-xl border-2 bg-input px-8" />
						</div>

						{/* Expiry and CVV */}
						<div
							className="grid grid-cols-2 gap-8 opacity-0"
							style={{
								opacity: cardProgress,
								transform: `translateY(${20 - cardProgress * 20}px)`,
							}}
						>
							<div className="space-y-6">
								<label className="text-3xl text-muted-foreground">Expiry</label>
								<div className="h-24 rounded-xl border-2 bg-input px-8" />
							</div>
							<div className="space-y-6">
								<label className="text-3xl text-muted-foreground">CVV</label>
								<div className="h-24 rounded-xl border-2 bg-input px-8" />
							</div>
						</div>

						{/* Processing */}
						{processingProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: processingProgress }}
							>
								<div className="h-16 w-16 animate-spin rounded-full border-8 border-primary border-t-transparent" />
							</div>
						)}

						{/* Success */}
						{successProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: successProgress }}
							>
								<div className="space-y-4 text-center">
									<div className="text-7xl text-green-500">✓</div>
									<div className="text-4xl font-semibold text-primary">
										Payment Successful
									</div>
									<div className="text-2xl text-muted-foreground">
										Your payment has been processed
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

export const paymentFlowMetadata: AnimationMetadata = {
	id: "payment-flow",
	title: "Payment Processing",
	description: "Visualization of secure payment processing flow",
	category: "payments",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};

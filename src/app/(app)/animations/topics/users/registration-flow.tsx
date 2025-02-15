"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	FORM_INPUT: [31, 90], // Form input animation
	VALIDATION: [91, 150], // Input validation
	SUBMISSION: [151, 210], // Form submission
	EMAIL_VERIFICATION: [211, 270], // Email verification
	SUCCESS: [271, 300], // Success state
} as const;

export const RegistrationFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const formProgress = interpolate(frame, STAGES.FORM_INPUT, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const validationProgress = interpolate(frame, STAGES.VALIDATION, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const submissionProgress = interpolate(frame, STAGES.SUBMISSION, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const verificationProgress = interpolate(
		frame,
		STAGES.EMAIL_VERIFICATION,
		[0, 1],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);

	const successProgress = interpolate(frame, STAGES.SUCCESS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-96 rounded-lg border bg-card p-6 shadow-lg">
					{/* Registration Form */}
					<div className="space-y-4">
						<h2 className="text-2xl font-bold text-foreground">Register</h2>

						{/* Name Input */}
						<div
							className="space-y-2 opacity-0"
							style={{
								opacity: formProgress,
								transform: `translateY(${20 - formProgress * 20}px)`,
							}}
						>
							<label className="text-sm text-muted-foreground">Full Name</label>
							<div className="h-10 rounded-md border bg-input px-3" />
						</div>

						{/* Email Input */}
						<div
							className="space-y-2 opacity-0"
							style={{
								opacity: formProgress,
								transform: `translateY(${40 - formProgress * 40}px)`,
							}}
						>
							<label className="text-sm text-muted-foreground">Email</label>
							<div className="h-10 rounded-md border bg-input px-3" />
						</div>

						{/* Password Input */}
						<div
							className="space-y-2 opacity-0"
							style={{
								opacity: formProgress,
								transform: `translateY(${60 - formProgress * 60}px)`,
							}}
						>
							<label className="text-sm text-muted-foreground">Password</label>
							<div className="h-10 rounded-md border bg-input px-3" />
						</div>

						{/* Validation Indicators */}
						{validationProgress > 0 && (
							<div
								className="space-y-2"
								style={{ opacity: validationProgress }}
							>
								<div className="flex items-center gap-2 text-xs text-green-500">
									<div className="h-1.5 w-1.5 rounded-full bg-green-500" />
									Password strength: Strong
								</div>
								<div className="flex items-center gap-2 text-xs text-green-500">
									<div className="h-1.5 w-1.5 rounded-full bg-green-500" />
									Email format: Valid
								</div>
							</div>
						)}

						{/* Submission Progress */}
						{submissionProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: submissionProgress }}
							>
								<div className="space-y-2 text-center">
									<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
									<div className="text-sm text-muted-foreground">
										Creating your account...
									</div>
								</div>
							</div>
						)}

						{/* Email Verification */}
						{verificationProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: verificationProgress }}
							>
								<div className="space-y-2 text-center">
									<div className="text-xl font-semibold text-primary">
										Check Your Email
									</div>
									<div className="text-sm text-muted-foreground">
										We've sent you a verification link
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
								<div className="space-y-2 text-center">
									<div className="text-3xl text-green-500">✓</div>
									<div className="text-xl font-semibold text-primary">
										Welcome Aboard!
									</div>
									<div className="text-sm text-muted-foreground">
										Your account is ready to use
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

export const registrationFlowMetadata: AnimationMetadata = {
	id: "registration-flow",
	title: "User Registration Flow",
	description:
		"Visualization of the user registration process including validation and verification",
	category: "users",
	duration: 10,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};

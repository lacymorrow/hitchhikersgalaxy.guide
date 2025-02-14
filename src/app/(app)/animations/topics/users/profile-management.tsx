"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	LOAD_PROFILE: [31, 90], // Load profile data
	EDIT_PROFILE: [91, 150], // Edit profile fields
	UPLOAD_AVATAR: [151, 210], // Avatar upload
	SAVE_CHANGES: [211, 270], // Save changes
	SUCCESS: [271, 300], // Success state
} as const;

export const ProfileManagement = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const loadProgress = interpolate(frame, STAGES.LOAD_PROFILE, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const editProgress = interpolate(frame, STAGES.EDIT_PROFILE, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const avatarProgress = interpolate(frame, STAGES.UPLOAD_AVATAR, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const saveProgress = interpolate(frame, STAGES.SAVE_CHANGES, [0, 1], {
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
				<div className="relative w-[32rem] rounded-lg border bg-card p-6 shadow-lg">
					<div className="space-y-6">
						<h2 className="text-2xl font-bold text-foreground">
							Profile Settings
						</h2>

						{/* Avatar Section */}
						<div className="flex items-center gap-4">
							<div
								className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary bg-muted"
								style={{
									opacity: loadProgress,
									transform: `scale(${loadProgress})`,
								}}
							>
								{/* Avatar Upload Progress */}
								{avatarProgress > 0 && (
									<div
										className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
										style={{ opacity: avatarProgress }}
									>
										<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
									</div>
								)}
							</div>
							<div
								className="space-y-1"
								style={{
									opacity: loadProgress,
									transform: `translateX(${20 - loadProgress * 20}px)`,
								}}
							>
								<h3 className="text-lg font-semibold">Profile Picture</h3>
								<p className="text-sm text-muted-foreground">
									PNG, JPG or GIF, max 2MB
								</p>
							</div>
						</div>

						{/* Profile Form */}
						<div className="space-y-4">
							{/* Display Name */}
							<div
								className="space-y-2"
								style={{
									opacity: loadProgress,
									transform: `translateY(${20 - loadProgress * 20}px)`,
								}}
							>
								<label className="text-sm text-muted-foreground">
									Display Name
								</label>
								<div
									className="h-10 rounded-md border bg-input px-3"
									style={{
										backgroundColor:
											editProgress > 0.5 ? "rgb(var(--primary))" : undefined,
										transition: "background-color 0.3s ease",
									}}
								/>
							</div>

							{/* Bio */}
							<div
								className="space-y-2"
								style={{
									opacity: loadProgress,
									transform: `translateY(${40 - loadProgress * 40}px)`,
								}}
							>
								<label className="text-sm text-muted-foreground">Bio</label>
								<div
									className="h-20 rounded-md border bg-input px-3"
									style={{
										backgroundColor:
											editProgress > 0.7 ? "rgb(var(--primary))" : undefined,
										transition: "background-color 0.3s ease",
									}}
								/>
							</div>

							{/* Social Links */}
							<div
								className="space-y-2"
								style={{
									opacity: loadProgress,
									transform: `translateY(${60 - loadProgress * 60}px)`,
								}}
							>
								<label className="text-sm text-muted-foreground">
									Social Links
								</label>
								<div className="space-y-2">
									<div
										className="h-10 rounded-md border bg-input px-3"
										style={{
											backgroundColor:
												editProgress > 0.9 ? "rgb(var(--primary))" : undefined,
											transition: "background-color 0.3s ease",
										}}
									/>
									<div
										className="h-10 rounded-md border bg-input px-3"
										style={{
											backgroundColor:
												editProgress > 0.9 ? "rgb(var(--primary))" : undefined,
											transition: "background-color 0.3s ease",
										}}
									/>
								</div>
							</div>
						</div>

						{/* Save Progress */}
						{saveProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: saveProgress }}
							>
								<div className="space-y-2 text-center">
									<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
									<div className="text-sm text-muted-foreground">
										Saving changes...
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
										Profile Updated
									</div>
									<div className="text-sm text-muted-foreground">
										Your changes have been saved
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

export const profileManagementMetadata: AnimationMetadata = {
	id: "profile-management",
	title: "Profile Management",
	description: "Visualization of user profile management and customization",
	category: "users",
	duration: 10,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};

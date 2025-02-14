"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	PLANS: [31, 90], // Show subscription plans
	SELECTION: [91, 150], // Plan selection
	BILLING: [151, 210], // Billing cycle
	FEATURES: [211, 270], // Feature access
} as const;

interface PlanNode {
	x: number;
	y: number;
	scale: number;
	opacity: number;
	name: string;
	price: string;
	features: string[];
	color: string;
}

const plans: PlanNode[] = [
	{
		name: "Basic",
		price: "$9.99/mo",
		features: ["Essential Features", "Email Support", "1 User"],
		color: "#22c55e", // green-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
	{
		name: "Pro",
		price: "$29.99/mo",
		features: [
			"Advanced Features",
			"Priority Support",
			"5 Users",
			"API Access",
		],
		color: "#3b82f6", // blue-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
	{
		name: "Enterprise",
		price: "$99.99/mo",
		features: [
			"All Features",
			"24/7 Support",
			"Unlimited Users",
			"Custom Integration",
			"SLA",
		],
		color: "#8b5cf6", // violet-500
		x: 0,
		y: 0,
		scale: 0,
		opacity: 0,
	},
];

export const SubscriptionFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate center position
	const centerX = width / 2;
	const centerY = height / 2;

	// Calculate progress for each stage
	const plansProgress = interpolate(frame, STAGES.PLANS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const selectionProgress = interpolate(frame, STAGES.SELECTION, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const billingProgress = interpolate(frame, STAGES.BILLING, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const featuresProgress = interpolate(frame, STAGES.FEATURES, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Update plan positions
	const updatedPlans = plans.map((plan, i) => ({
		...plan,
		x: centerX + (i - 1) * 320,
		y: centerY,
		scale: interpolate(plansProgress, [i * 0.2, i * 0.2 + 0.2], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
		opacity: interpolate(plansProgress, [i * 0.2, i * 0.2 + 0.2], [0, 1], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	}));

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-[90%] min-w-[1200px] max-w-[1800px] rounded-2xl border-2 bg-card p-16 shadow-xl">
					{/* Subscription Plans */}
					{updatedPlans.map((plan, i) => (
						<div
							key={plan.name}
							className="absolute"
							style={{
								left: plan.x,
								top: plan.y,
								transform: `translate(-50%, -50%) scale(${
									plan.scale * (i === 1 && selectionProgress > 0.5 ? 1.1 : 1)
								})`,
								opacity: plan.opacity,
							}}
						>
							<div
								className={`w-[400px] rounded-2xl border-2 bg-card p-12 shadow-xl transition-all ${
									i === 1 && selectionProgress > 0.5
										? "border-primary ring-4 ring-primary ring-offset-4"
										: ""
								}`}
							>
								<div className="space-y-8">
									<div className="space-y-4">
										<h3
											className="text-4xl font-bold"
											style={{ color: plan.color }}
										>
											{plan.name}
										</h3>
										<div className="text-5xl font-bold">{plan.price}</div>
									</div>

									<div className="space-y-4">
										{plan.features.map((feature) => (
											<div
												key={feature}
												className="flex items-center gap-4 text-xl"
												style={{
													opacity: featuresProgress > 0 && i === 1 ? 1 : 0.6,
												}}
											>
												<div
													className="h-3 w-3 rounded-full"
													style={{ backgroundColor: plan.color }}
												/>
												{feature}
											</div>
										))}
									</div>

									{/* Billing Cycle */}
									{i === 1 && billingProgress > 0 && (
										<div className="space-y-4">
											<div className="h-[2px] bg-border" />
											<div className="flex items-center justify-between text-xl">
												<span>Billing Cycle</span>
												<span className="font-medium text-primary">
													Monthly
												</span>
											</div>
											<div className="flex items-center justify-between text-xl">
												<span>Next Billing</span>
												<span className="font-medium text-primary">
													Jan 1, 2024
												</span>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export const subscriptionFlowMetadata: AnimationMetadata = {
	id: "subscription-flow",
	title: "Subscription Management",
	description: "Visualization of subscription plans and management",
	category: "payments",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};

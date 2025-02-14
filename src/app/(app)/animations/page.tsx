"use client";

import { Card } from "@/components/ui/card";
import { useEffect } from "react";
import {
	BeamOfLight,
	beamOfLightMetadata,
} from "./components/primitives/beam-of-light";
import { withErrorBoundary } from "./components/with-error-boundary";
import { AnimationGallery } from "./preview/animation-gallery";
import { AnimationPreview } from "./preview/animation-preview";
import { useAnimationStore } from "./store/animation-store";
import { LoginFlow, loginFlowMetadata } from "./topics/auth/login-flow";
import {
	InvoiceFlow,
	invoiceFlowMetadata,
} from "./topics/payments/invoice-flow";
import {
	PaymentFlow,
	paymentFlowMetadata,
} from "./topics/payments/payment-flow";
import {
	SubscriptionFlow,
	subscriptionFlowMetadata,
} from "./topics/payments/subscription-flow";
import {
	ProfileManagement,
	profileManagementMetadata,
} from "./topics/users/profile-management";
import { RbacFlow, rbacFlowMetadata } from "./topics/users/rbac-flow";
import {
	RegistrationFlow,
	registrationFlowMetadata,
} from "./topics/users/registration-flow";
import { type AnimationComponent } from "./types";

// Register all animations here with error boundaries
const animations: Record<string, AnimationComponent> = {
	[beamOfLightMetadata.id]: {
		Component: withErrorBoundary(BeamOfLight, beamOfLightMetadata),
		metadata: beamOfLightMetadata,
	},
	[loginFlowMetadata.id]: {
		Component: withErrorBoundary(LoginFlow, loginFlowMetadata),
		metadata: loginFlowMetadata,
	},
	[registrationFlowMetadata.id]: {
		Component: withErrorBoundary(RegistrationFlow, registrationFlowMetadata),
		metadata: registrationFlowMetadata,
	},
	[profileManagementMetadata.id]: {
		Component: withErrorBoundary(ProfileManagement, profileManagementMetadata),
		metadata: profileManagementMetadata,
	},
	[rbacFlowMetadata.id]: {
		Component: withErrorBoundary(RbacFlow, rbacFlowMetadata),
		metadata: rbacFlowMetadata,
	},
	[paymentFlowMetadata.id]: {
		Component: withErrorBoundary(PaymentFlow, paymentFlowMetadata),
		metadata: paymentFlowMetadata,
	},
	[subscriptionFlowMetadata.id]: {
		Component: withErrorBoundary(SubscriptionFlow, subscriptionFlowMetadata),
		metadata: subscriptionFlowMetadata,
	},
	[invoiceFlowMetadata.id]: {
		Component: withErrorBoundary(InvoiceFlow, invoiceFlowMetadata),
		metadata: invoiceFlowMetadata,
	},
} as const;

export default function AnimationsPage() {
	const { selectedAnimation, setAnimations } = useAnimationStore();

	// Initialize animations in store
	useEffect(() => {
		const animationList = Object.entries(animations).map(([id, animation]) => ({
			...animation.metadata,
			id,
		}));
		setAnimations(animationList);
	}, [setAnimations]);

	return (
		<div className="container mx-auto space-y-8 py-8">
			<h1 className="text-4xl font-bold">Animations Gallery</h1>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div className="space-y-4">
					<h2 className="text-2xl font-semibold">Available Animations</h2>
					<AnimationGallery />
				</div>

				<div className="space-y-4">
					<h2 className="text-2xl font-semibold">Preview</h2>
					{selectedAnimation ? (
						<AnimationPreview
							animation={
								animations[selectedAnimation.id] ?? {
									Component: BeamOfLight,
									metadata: selectedAnimation,
								}
							}
						/>
					) : (
						<Card className="p-8 text-center text-muted-foreground">
							Select an animation to preview
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

import React from "react";
import { type AnimationComponent } from "../types";
import { AnimationErrorBoundary } from "./error-boundary";

export const withErrorBoundary = (
	WrappedComponent: React.ComponentType,
	metadata: AnimationComponent["metadata"],
) => {
	const WithErrorBoundary = (props: any) => {
		return (
			<AnimationErrorBoundary
				fallback={
					<div className="flex h-full w-full items-center justify-center bg-muted/10 p-8">
						<div className="text-center">
							<h3 className="text-lg font-semibold">{metadata.title} Error</h3>
							<p className="text-sm text-muted-foreground">
								Failed to render animation
							</p>
						</div>
					</div>
				}
			>
				<WrappedComponent {...props} />
			</AnimationErrorBoundary>
		);
	};

	WithErrorBoundary.displayName = `withErrorBoundary(${
		WrappedComponent.displayName || WrappedComponent.name || "Component"
	})`;

	return WithErrorBoundary;
};

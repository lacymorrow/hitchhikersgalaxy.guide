import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import React from "react";

interface Props {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class AnimationErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log the error to an error reporting service
		console.error("Animation Error:", error, errorInfo);
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			// Render custom fallback UI
			return (
				this.props.fallback || (
					<Card className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
						<AlertCircle className="h-12 w-12 text-destructive" />
						<div className="text-center">
							<h3 className="text-lg font-semibold">Animation Error</h3>
							<p className="text-sm text-muted-foreground">
								{this.state.error?.message || "Something went wrong"}
							</p>
						</div>
						<Button
							variant="outline"
							onClick={this.handleRetry}
							className="gap-2"
						>
							<RefreshCw className="h-4 w-4" />
							Retry
						</Button>
					</Card>
				)
			);
		}

		return this.props.children;
	}
}

"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/server/actions/feedback-actions";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

interface FeedbackDialogProps {
	trigger?: React.ReactNode;
	className?: string;
}

export const FeedbackDialog = ({ trigger, className }: FeedbackDialogProps) => {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [feedback, setFeedback] = useState("");
	const [open, setOpen] = useState(false);

	// Reset form when dialog closes
	useEffect(() => {
		if (!open) {
			// Small delay to allow animation to complete
			const timeout = setTimeout(() => {
				setFeedback("");
				setError(null);
				setSuccess(false);
			}, 300);
			return () => clearTimeout(timeout);
		}
	}, [open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!feedback.trim()) return;

		setLoading(true);
		setSuccess(false);
		setError(null);

		try {
			const result = await submitFeedback({
				content: feedback.trim(),
				source: "dialog",
			});

			if (result.success) {
				setSuccess(true);
				// Close dialog after success
				const timeout = setTimeout(() => {
					setOpen(false);
				}, 1500);
				return () => clearTimeout(timeout);
			}
		} catch (error) {
			setError("Failed to send feedback. Please try again.");
			console.error("Feedback submission error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="w-full" asChild>
				<div className="w-full">
					{trigger || (
						<Button variant="ghost" className={`w-full ${className}`}>
							Feedback
						</Button>
					)}
				</div>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Send Feedback</DialogTitle>
						<DialogDescription>
							Help us improve by sharing your thoughts, suggestions, or
							reporting issues.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 space-y-4">
						<Textarea
							value={feedback}
							onChange={(e) => setFeedback(e.target.value)}
							placeholder="Your feedback..."
							className="min-h-[100px]"
							disabled={loading}
						/>
						{error && <p className="text-sm text-red-500">{error}</p>}
						{success && (
							<p className="text-sm text-green-500">
								Thank you for your feedback! 🚀
							</p>
						)}
					</div>
					<DialogFooter className="mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading || !feedback.trim()}>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Sending...
								</>
							) : success ? (
								"Sent!"
							) : (
								"Send Feedback"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

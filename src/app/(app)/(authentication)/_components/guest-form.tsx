"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";

export const GuestForm = () => {
	const [name, setName] = useState("");
	const [isPending, startTransition] = useTransition();
	const searchParams = useSearchParams();
	const nextUrl = searchParams?.get(SEARCH_PARAM_KEYS.nextUrl);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Please enter your name");
			return;
		}

		startTransition(async () => {
			try {
				const result = await signIn("guest", {
					name: name.trim(),
					redirectTo: nextUrl || "/dashboard",
				});

				if (result?.error) {
					toast.error("Failed to continue as guest");
				}
			} catch (error) {
				console.error("Guest sign in error:", error);
				toast.error("Failed to continue as guest");
			}
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="guest-name">Your Name</Label>
				<Input
					id="guest-name"
					type="text"
					placeholder="Enter your name to continue"
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={isPending}
					required
				/>
			</div>
			<Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
				{isPending ? "Continuing..." : "Continue as Guest"}
			</Button>
		</form>
	);
};

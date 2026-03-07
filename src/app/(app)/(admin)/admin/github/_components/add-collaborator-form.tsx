"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addCollaboratorAction } from "../actions";

export function AddCollaboratorForm() {
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;

		setLoading(true);
		try {
			const result = await addCollaboratorAction(username);
			if (result.success) {
				toast({
					title: "Invitation Sent",
					description: `GitHub invitation sent to @${username}.`,
				});
				setUsername("");
			} else {
				toast({
					title: "Error",
					description: result.error || "Failed to add collaborator",
					variant: "destructive",
				});
			}
		} catch {
			toast({
				title: "Error",
				description: "Failed to add collaborator",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={(e) => void handleSubmit(e)} className="flex items-center gap-2">
			<Input
				placeholder="GitHub username"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				className="w-56"
				disabled={loading}
			/>
			<Button type="submit" disabled={loading || !username.trim()} size="sm">
				<UserPlus className="h-4 w-4 mr-2" />
				Add Collaborator
			</Button>
		</form>
	);
}

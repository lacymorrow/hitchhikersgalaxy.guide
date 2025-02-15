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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon } from "@radix-ui/react-icons";
import * as React from "react";

interface CreateApiKeyDialogProps {
	onSubmit: (data: {
		userId: string;
		name: string;
		description?: string;
		expiresIn?: string;
	}) => Promise<{ key?: string }>;
	userId: string;
}

export function CreateApiKeyDialog({ onSubmit, userId }: CreateApiKeyDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [expiresIn, setExpiresIn] = React.useState<string>();
	const [isLoading, setIsLoading] = React.useState(false);
	const { toast } = useToast();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await onSubmit({
				userId,
				name,
				description,
				expiresIn,
			});

			if (result.key) {
				// Copy to clipboard
				await navigator.clipboard.writeText(result.key);
				toast({
					title: "API key created",
					description: "The API key has been copied to your clipboard.",
				});
				setOpen(false);
				setName("");
				setDescription("");
				setExpiresIn(undefined);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to create API key. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className="mr-2 h-4 w-4" /> Create API Key
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create API Key</DialogTitle>
						<DialogDescription>
							Create a new API key to access the API. Keep this key secure and never
							share it publicly.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="My API Key"
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional description for this API key"
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="expires">Expires</Label>
							<Select value={expiresIn} onValueChange={setExpiresIn}>
								<SelectTrigger id="expires">
									<SelectValue placeholder="Never" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="7">7 days</SelectItem>
									<SelectItem value="30">30 days</SelectItem>
									<SelectItem value="90">90 days</SelectItem>
									<SelectItem value="365">1 year</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							type="button"
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

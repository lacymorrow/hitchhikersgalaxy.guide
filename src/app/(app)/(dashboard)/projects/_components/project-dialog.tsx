"use client";

import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createProject, updateProject } from "@/server/actions/projects";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Project {
	id: string;
	name: string;
}

interface ProjectDialogProps {
	project?: Project;
	mode: "create" | "edit";
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onComplete?: () => void;
	teamId?: string;
}

export const ProjectDialog = ({
	project,
	mode,
	open,
	onOpenChange,
	onComplete,
	teamId,
}: ProjectDialogProps) => {
	const [name, setName] = useState(project?.name ?? "");
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();
	const router = useRouter();
	const { data: session } = useSession();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		if (mode === "create" && (!teamId || !session?.user?.id)) {
			toast({
				title: "Error",
				description: "Missing team or user information. Please try again.",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		try {
			if (mode === "create" && teamId && session?.user?.id) {
				await createProject(name, teamId, session.user.id);
				toast({
					title: "Project created",
					description: "Your new project has been created successfully.",
				});
			} else if (project?.id) {
				await updateProject(project.id, name);
				toast({
					title: "Project updated",
					description: "Your project has been updated successfully.",
				});
			}
			router.refresh();
			onComplete?.();
		} catch (error) {
			console.error("Failed to handle project:", error);
			toast({
				title: "Error",
				description: `Failed to ${mode} project. Please try again.`,
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		onOpenChange?.(false);
		setName(project?.name ?? "");
	};

	return (
		<DialogContent>
			<form onSubmit={handleSubmit}>
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create Project" : "Edit Project"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new project to organize your work."
							: "Update your project details."}
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="name">Project Name</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter project name"
							className="w-full"
							autoFocus
							disabled={isLoading}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						type="button"
						onClick={handleClose}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={!name.trim() || isLoading}>
						{isLoading ? (
							<>
								<span className="mr-2">
									{mode === "create" ? "Creating..." : "Updating..."}
								</span>
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
							</>
						) : mode === "create" ? (
							"Create Project"
						) : (
							"Update Project"
						)}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
};

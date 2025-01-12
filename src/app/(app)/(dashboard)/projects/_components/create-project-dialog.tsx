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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createProject } from "@/server/actions/projects";
import { getUserTeams } from "@/server/actions/teams";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Team {
	team: {
		id: string;
		name: string;
	};
	role: string;
}

interface CreateProjectDialogProps {
	userId: string;
	children?: React.ReactNode;
}

export function CreateProjectDialog({ userId, children }: CreateProjectDialogProps) {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [teams, setTeams] = useState<Team[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const loadTeams = async () => {
			try {
				const userTeams = await getUserTeams(userId);
				setTeams(userTeams);
			} catch (error) {
				console.error("Failed to load teams:", error);
				toast({
					title: "Error",
					description: "Failed to load teams. Please try again.",
					variant: "destructive",
				});
			}
		};

		if (open) {
			loadTeams();
		}
	}, [open, userId, toast]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const formData = new FormData(e.currentTarget);
			const name = formData.get("name") as string;
			const teamId = formData.get("teamId") as string;

			await createProject(name, teamId, userId);
			toast({
				title: "Success",
				description: `Project "${name}" has been created.`,
			});
			setOpen(false);
			router.refresh();
		} catch (error) {
			console.error("Failed to create project:", error);
			toast({
				title: "Error",
				description: "Failed to create project. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{children
					? (
						<div>{children}</div>
					)
					: (
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create Project
						</Button>
					)}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Project</DialogTitle>
					<DialogDescription>
						Create a new project to organize your work.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Input
							id="name"
							name="name"
							placeholder="Project name"
							required
							autoComplete="off"
						/>
					</div>
					<div className="space-y-2">
						<Select name="teamId" required>
							<SelectTrigger>
								<SelectValue placeholder="Select a team" />
							</SelectTrigger>
							<SelectContent>
								{teams.map(({ team }) => (
									<SelectItem key={team.id} value={team.id}>
										{team.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Creating..." : "Create Project"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

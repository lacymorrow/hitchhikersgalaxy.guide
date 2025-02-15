"use client";

import { useTeam } from "@/components/providers/team-provider";
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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { createProject } from "@/server/actions/projects";
import { createTeam, getUserTeams } from "@/server/actions/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	teamId: z.string().min(1, "Team is required"),
});

interface Team {
	team: {
		id: string;
		name: string;
		createdAt: Date;
		updatedAt: Date | null;
	};
	role: string;
}

interface CreateProjectDialogProps {
	userId: string;
	children: React.ReactNode;
}

export const CreateProjectAndTeamDialog = ({
	userId,
	children,
}: CreateProjectDialogProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showNewTeamInput, setShowNewTeamInput] = useState(false);
	const [newTeamName, setNewTeamName] = useState("");
	const [teams, setTeams] = useState<Team[]>([]);
	const { selectedTeamId } = useTeam();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			teamId: selectedTeamId || "",
		},
	});

	useEffect(() => {
		const loadTeams = async () => {
			try {
				const userTeams = await getUserTeams(userId);
				setTeams(userTeams);

				// Set the active team if no team is selected
				if (!form.getValues("teamId") && selectedTeamId) {
					form.setValue("teamId", selectedTeamId);
				}
			} catch (error) {
				console.error("Failed to load teams:", error);
			}
		};

		if (isOpen) {
			loadTeams();
		}
	}, [isOpen, userId, selectedTeamId, form]);

	const handleCreateTeam = async () => {
		if (!newTeamName) return;
		setIsLoading(true);
		try {
			const team = await createTeam(newTeamName, userId);
			form.setValue("teamId", team.id);
			setShowNewTeamInput(false);
			setNewTeamName("");
			// Refresh teams list
			const userTeams = await getUserTeams(userId);
			setTeams(userTeams);
		} catch (error) {
			console.error("Failed to create team:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		try {
			await createProject(values.name, values.teamId, userId);
			setIsOpen(false);
			form.reset();
		} catch (error) {
			console.error("Failed to create project:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
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
						Create a new project in your team.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Project Name</FormLabel>
									<FormControl>
										<Input placeholder="My Project" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{showNewTeamInput ? (
							<div className="space-y-2">
								<FormLabel>New Team Name</FormLabel>
								<div className="flex gap-2">
									<Input
										placeholder="My Team"
										value={newTeamName}
										onChange={(e) => setNewTeamName(e.target.value)}
									/>
									<Button
										type="button"
										onClick={handleCreateTeam}
										disabled={!newTeamName || isLoading}
									>
										Create Team
									</Button>
								</div>
								<Button
									type="button"
									variant="ghost"
									onClick={() => setShowNewTeamInput(false)}
								>
									Cancel
								</Button>
							</div>
						) : (
							<FormField
								control={form.control}
								name="teamId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Team</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a team" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<Button
													type="button"
													variant="ghost"
													className="w-full justify-start"
													onClick={() => setShowNewTeamInput(true)}
												>
													<Plus className="mr-2 h-4 w-4" />
													Create New Team
												</Button>
												{teams.map(({ team }) => (
													<SelectItem key={team.id} value={team.id}>
														{team.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<DialogFooter>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Creating..." : "Create Project"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableDialog } from "@/components/ui/data-table/data-table-dialog";
import { useToast } from "@/hooks/use-toast";
import {
	createTeam,
	deleteTeam,
	getUserTeams,
	updateTeam,
} from "@/server/actions/teams";
import type { ColumnDef } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Team {
	team: {
		id: string;
		name: string;
		type: "personal" | "workspace";
	};
	role: string;
}

export default function TeamsPage() {
	const { data: session } = useSession();
	const { toast } = useToast();
	const [teams, setTeams] = useState<Team[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
	const [newTeamName, setNewTeamName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (session?.user?.id) {
			void loadTeams();
		}
	}, [session?.user?.id]);

	const loadTeams = async () => {
		if (!session?.user?.id) return;
		setIsLoading(true);
		try {
			const teams = await getUserTeams(session.user.id);
			setTeams(teams);
		} catch (error) {
			console.error("Failed to load teams:", error);
			toast({
				title: "Error",
				description: "Failed to load teams",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleAdd = () => {
		setShowAddDialog(true);
	};

	const handleEdit = (team: Team) => {
		setSelectedTeam(team);
		setNewTeamName(team.team.name);
		setShowEditDialog(true);
	};

	const handleDelete = async (team: Team) => {
		if (team.team.type === "personal") {
			toast({
				title: "Cannot delete personal team",
				description: "Your personal team cannot be deleted.",
				variant: "destructive",
			});
			return;
		}

		try {
			await deleteTeam(team.team.id);
			await loadTeams();
			toast({
				title: "Success",
				description: "Team deleted successfully",
			});
		} catch (error) {
			console.error("Failed to delete team:", error);
			toast({
				title: "Error",
				description: "Failed to delete team",
				variant: "destructive",
			});
		}
	};

	const handleAddSubmit = async () => {
		if (!session?.user?.id) return;
		setIsSubmitting(true);
		try {
			await createTeam(session.user.id, newTeamName);
			await loadTeams();
			setShowAddDialog(false);
			setNewTeamName("");
			toast({
				title: "Success",
				description: "Team created successfully",
			});
		} catch (error) {
			console.error("Failed to create team:", error);
			toast({
				title: "Error",
				description: "Failed to create team",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditSubmit = async () => {
		if (!selectedTeam) return;
		setIsSubmitting(true);
		try {
			await updateTeam(selectedTeam.team.id, { name: newTeamName });
			await loadTeams();
			setShowEditDialog(false);
			setSelectedTeam(null);
			setNewTeamName("");
			toast({
				title: "Success",
				description: "Team updated successfully",
			});
		} catch (error) {
			console.error("Failed to update team:", error);
			toast({
				title: "Error",
				description: "Failed to update team",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const columns: ColumnDef<Team>[] = [
		{
			accessorFn: (row) => row.team.name,
			header: "Name",
			cell: ({ row }) => {
				const isPersonal = row.original.team.type === "personal";
				return (
					<div className="flex items-center gap-2">
						{isPersonal && (
							<Badge variant="outline" className="mr-2">
								Personal
							</Badge>
						)}
						{row.original.team.name}
					</div>
				);
			},
		},
		{
			accessorKey: "role",
			header: "Role",
		},
		{
			id: "actions",
			cell: ({ row }) => {
				const isPersonal = row.original.team.type === "personal";
				return (
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => handleEdit(row.original)}
							className="text-sm text-gray-600 hover:text-gray-900"
						>
							Edit
						</button>
						{!isPersonal && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<button
										type="button"
										className="text-sm text-red-600 hover:text-red-900"
									>
										Delete
									</button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Team</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete this team? This action
											will also delete all associated projects, API keys, and
											cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={(e) => {
												e.preventDefault();
												void handleDelete(row.original);
											}}
											className="bg-red-600 hover:bg-red-700"
										>
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				);
			},
		},
	];

	return (
		<div className="container mx-auto py-10">
			<div className="mb-8">
				<h2 className="text-2xl font-bold tracking-tight">Teams</h2>
				<p className="text-muted-foreground">
					Manage your teams and their members. Every user has a personal team
					that cannot be deleted.
				</p>
			</div>

			<DataTable
				columns={columns}
				data={teams}
				onAdd={handleAdd}
				addButtonLabel="Add Team"
				searchPlaceholder="Filter teams..."
				isLoading={isLoading}
			/>

			<DataTableDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				title="Add Team"
				description="Create a new team to manage projects and collaborate with others."
				onSubmit={() => {
					void handleAddSubmit();
				}}
				submitLabel="Create"
				isSubmitting={isSubmitting}
				fields={[
					{
						label: "Name",
						value: newTeamName,
						onChange: setNewTeamName,
						placeholder: "Enter team name",
					},
				]}
			/>

			<DataTableDialog
				open={showEditDialog}
				onOpenChange={setShowEditDialog}
				title="Edit Team"
				description={
					selectedTeam?.team.type === "personal"
						? "Update your personal team's information."
						: "Update your team's information."
				}
				onSubmit={() => {
					void handleEditSubmit();
				}}
				submitLabel="Save Changes"
				isSubmitting={isSubmitting}
				fields={[
					{
						label: "Name",
						value: newTeamName,
						onChange: setNewTeamName,
						placeholder: "Enter team name",
						type: selectedTeam?.team.type === "personal" ? "disabled" : "text",
					},
				]}
			/>
		</div>
	);
}

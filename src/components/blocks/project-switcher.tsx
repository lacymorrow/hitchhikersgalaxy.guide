"use client";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { ProjectDialog } from "@/components/modules/projects/project-dialog";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTeam } from "@/components/providers/team-provider";
import { cn } from "@/lib/utils";
import { getTeamProjects } from "@/server/actions/projects";
import { useSession } from "next-auth/react";

interface ProjectSwitcherProject {
	id: string;
	name: string;
}

interface ProjectSwitcherProps {
	className?: string;
	onProjectChange?: (projectId: string) => void;
}

export const ProjectSwitcher = ({ className, onProjectChange }: ProjectSwitcherProps) => {
	const { data: session } = useSession();
	const { selectedTeamId } = useTeam();

	const [projects, setProjects] = React.useState<ProjectSwitcherProject[]>([]);
	const [activeProject, setActiveProject] = React.useState<ProjectSwitcherProject | null>(null);
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		let isCancelled = false;

		async function loadProjects() {
			if (!selectedTeamId) {
				setProjects([]);
				setActiveProject(null);
				return;
			}

			try {
				const fetched = await getTeamProjects(selectedTeamId);
				if (isCancelled) return;

				const nextProjects = (fetched || []).map((p) => ({ id: p.id, name: p.name }));
				setProjects(nextProjects);

				// Keep selection stable across refreshes; default to first project.
				setActiveProject((previous) => {
					if (previous && nextProjects.some((p) => p.id === previous.id)) return previous;
					return nextProjects[0] ?? null;
				});
			} catch (error) {
				// No toast here yet: we don’t want a global header to spam notifications.
				// The Projects page already handles errors with UX.
				console.error("Failed to load projects:", error);
				setProjects([]);
				setActiveProject(null);
			}
		}

		void loadProjects();
		return () => {
			isCancelled = true;
		};
	}, [selectedTeamId]);

	const handleProjectSelect = React.useCallback(
		(project: ProjectSwitcherProject) => {
			setActiveProject(project);
			setOpen(false);
			onProjectChange?.(project.id);
		},
		[onProjectChange]
	);

	return (
		<div className={cn("min-w-0", className)}>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="flex w-[260px] max-w-full items-center justify-between gap-2"
						disabled={!selectedTeamId}
						aria-label="Select project"
					>
						<div className="flex min-w-0 items-center gap-2">
							<span className="truncate text-sm">
								{activeProject?.name ?? (selectedTeamId ? "Select project" : "Select team first")}
							</span>
						</div>
						<CaretSortIcon className="h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[260px] p-0" align="start">
					<Command>
						<CommandInput placeholder="Search project..." />
						<CommandList>
							<CommandEmpty>No projects found.</CommandEmpty>
							<CommandGroup heading="Projects">
								{projects.map((project) => (
									<CommandItem
										key={project.id}
										onSelect={() => handleProjectSelect(project)}
										className="text-sm"
									>
										<span className="truncate">{project.name}</span>
										<CheckIcon
											className={cn(
												"ml-auto h-4 w-4",
												activeProject?.id === project.id ? "opacity-100" : "opacity-0"
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup>
								{session?.user?.id ? (
									<ProjectDialog userId={session.user.id} variant="create">
										<CommandItem onSelect={() => setOpen(false)} className="text-sm">
											<PlusIcon className="mr-2 h-4 w-4" />
											Create Project
										</CommandItem>
									</ProjectDialog>
								) : (
									<CommandItem disabled className="text-sm">
										<PlusIcon className="mr-2 h-4 w-4" />
										Sign in to create a project
									</CommandItem>
								)}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};


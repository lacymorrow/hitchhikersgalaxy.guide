import type { TeamData } from "@/components/providers/team-data";
import { TeamProvider } from "@/components/providers/team-provider";
import { SidebarProvider } from "@/components/ui/sidebar";

interface SidebarLayoutProps {
	children: React.ReactNode;
	initialTeams: TeamData[];
}

export function SidebarLayout({
	children,
	initialTeams,
}: SidebarLayoutProps) {
	return (
		<>
			<TeamProvider initialTeams={initialTeams}>
				<SidebarProvider>
					{children}
				</SidebarProvider>
			</TeamProvider>
		</>
	);
}

import { getUserTeams } from "@/server/actions/teams";
import { auth } from "@/server/auth";

export interface TeamData {
	id: string;
	name: string;
}

export async function getTeamData() {
	const session = await auth();
	if (!session?.user?.id) return [];

	const userTeams = await getUserTeams(session.user.id);
	return userTeams.map((ut) => ({
		id: ut.team.id,
		name: ut.team.name,
	}));
}

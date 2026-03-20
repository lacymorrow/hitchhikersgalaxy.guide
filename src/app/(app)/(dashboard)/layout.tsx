import { type ReactNode, Suspense } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { TeamProvider } from "@/components/providers/team-provider";
import { logger } from "@/lib/logger";
import { auth } from "@/server/auth";
import { teamService } from "@/server/services/team-service";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await auth();
  let userTeams = [{ id: "personal", name: "Personal" }];

  if (session?.user?.id && process.env.DATABASE_URL) {
    try {
      const teams = await teamService.getUserTeams(session.user.id);
      if (teams && teams.length > 0) {
        userTeams = teams.map((tm) => ({
          id: tm.team.id,
          name: tm.team.name,
        }));
      } else {
        const personalTeam = await teamService.ensureOnePersonalTeam(session.user.id);
        if (personalTeam?.id && personalTeam?.name) {
          userTeams = [{ id: personalTeam.id, name: personalTeam.name }];
        }
      }
    } catch (error) {
      logger.error("Failed to fetch user teams", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: session.user.id,
      });
    }
  }

  return (
    <TeamProvider initialTeams={userTeams}>
      <DashboardLayout>
        <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
      </DashboardLayout>
    </TeamProvider>
  );
}

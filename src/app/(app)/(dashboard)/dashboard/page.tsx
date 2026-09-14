import type { Metadata } from "next";

import { DownloadSection } from "@/app/(app)/(dashboard)/_components/download-section";
import { OverviewTabs } from "@/app/(app)/(dashboard)/_components/overview-tabs";
import { RecentSales } from "@/app/(app)/(dashboard)/_components/recent-sales";
import { RevenueChart } from "@/app/(app)/(dashboard)/_components/revenue-chart";
import { StatsCards } from "@/app/(app)/(dashboard)/_components/stats-cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { getDashboardData } from "./_hooks/use-dashboard-data";

export const metadata: Metadata = constructMetadata({
  title: "Dashboard",
  description: "Your project overview at a glance.",
});

export default async function DashboardPage() {
  const {
    session,
    isUserAdmin,
    hasGitHubConnection,
    githubUsername,
    hasVercelConnection,
    isCustomer,
  } = await getDashboardData();

  return (
    <div className="flex-1 space-y-5 p-4 pt-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold leading-6 tracking-[-0.02em]">Dashboard</h1>
        <DownloadSection
          isAuthenticated={!!session.user?.id}
          isCustomer={isCustomer || isUserAdmin}
          hasGitHubConnection={hasGitHubConnection}
          githubUsername={githubUsername}
          hasVercelConnection={hasVercelConnection}
        />
      </div>

      <StatsCards />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* RevenueChart carries its own card. */}
        <div className="col-span-4">
          <RevenueChart />
        </div>
        <Card className="col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Recent sales</CardTitle>
            <CardDescription className="text-xs">265 this month</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>

      <OverviewTabs />
    </div>
  );
}

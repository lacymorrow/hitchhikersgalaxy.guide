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
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name ?? "friend"}
        </h2>
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
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue and expenses for the current year</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
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

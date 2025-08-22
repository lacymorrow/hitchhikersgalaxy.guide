import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header";
import { Badge } from "@/components/ui/badge";
import { DownloadSection } from "@/app/(app)/(dashboard)/_components/download-section";
import { OnboardingCheck } from "@/components/modules/onboarding/onboarding-check";
import { StatsCards } from "./_components/stats-cards";
import { RecentActivity } from "./_components/recent-activity";
import { QuickActions } from "./_components/quick-actions";
import { DashboardTabs } from "./_components/dashboard-tabs";
import { useDashboardData } from "./_hooks/use-dashboard-data";

export default async function DashboardPage() {
	const { session, isUserAdmin, hasGitHubConnection, hasVercelConnection, isCustomer, isSubscribed } = await useDashboardData();

	return (
		<div className="container mx-auto py-6 space-y-4">
			<OnboardingCheck
				user={session.user}
				hasGitHubConnection={hasGitHubConnection}
				hasVercelConnection={hasVercelConnection}
				hasPurchased={isCustomer || isUserAdmin}
				forceEnabled={isUserAdmin}
			/>

			<PageHeader>
				<div className="w-full flex flex-wrap items-center justify-between gap-2">
					<div>
						<div className="flex items-center gap-2">
							<PageHeaderHeading>
								Hello, {session.user.name ?? session.user.email ?? "friend"}
							</PageHeaderHeading>
							{isCustomer && (
								<Badge variant="outline" className="whitespace-nowrap">
									Customer
								</Badge>
							)}

							{isSubscribed && (
								<Badge variant="outline" className="whitespace-nowrap">
									Active Subscription
								</Badge>
							)}

							{isUserAdmin && (
								<Badge variant="outline" className="whitespace-nowrap">
									Admin
								</Badge>
							)}
						</div>
						<PageHeaderDescription>
							Check out what's happening with your projects
						</PageHeaderDescription>
					</div>
					<DownloadSection isCustomer={isCustomer || isUserAdmin} />
				</div>
			</PageHeader>

			<StatsCards />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<RecentActivity />
			</div>
			<QuickActions />
			<DashboardTabs hasGitHubConnection={hasGitHubConnection} />
		</div>
	);
}
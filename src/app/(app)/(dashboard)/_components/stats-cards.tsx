import { ActivityIcon, Download, Globe, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCards() {
	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
					<Download className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">45.2k</div>
					<div className="text-xs text-muted-foreground">+20.1% from last month</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Active Users</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">2,350</div>
					<div className="text-xs text-muted-foreground">+180.1% from last month</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">Active Deployments</CardTitle>
					<Globe className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">12,234</div>
					<div className="text-xs text-muted-foreground">+19% from last month</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium">System Health</CardTitle>
					<ActivityIcon className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">99.9%</div>
					<div className="text-xs text-muted-foreground">+0.1% from last week</div>
				</CardContent>
			</Card>
		</div>
	);
}

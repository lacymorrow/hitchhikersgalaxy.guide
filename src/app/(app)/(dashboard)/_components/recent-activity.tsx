import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { activityIcons, recentActivity } from "./mock-data";

export function RecentActivity() {
	return (
		<Card className="col-span-3">
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>Latest actions across your projects</CardDescription>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[300px]">
					<div className="space-y-4">
						{recentActivity.map((activity) => {
							const Icon = activityIcons[activity.type] || AlertCircle;
							return (
								<div key={activity.id} className="flex items-center">
									<Avatar className="h-9 w-9">
										<AvatarImage src={activity.user.avatar} alt={activity.user.name} />
										<AvatarFallback>
											{activity.user.name
												.split(" ")
												.map((n) => n[0])
												.join("")}
										</AvatarFallback>
									</Avatar>
									<div className="ml-4 space-y-1">
										<p className="text-sm font-medium leading-none">{activity.title}</p>
										<p className="text-sm text-muted-foreground">
											{activity.user.name} • {activity.time}
										</p>
									</div>
									<div className="ml-auto">
										<Icon className="h-4 w-4 text-muted-foreground" />
									</div>
								</div>
							);
						})}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}

"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeInput } from "@/components/ui/time-input";
import {
	getNotificationPreferences,
	updateNotificationChannels,
	updateNotificationSchedule,
	updateNotificationTypes,
} from "@/server/actions/notifications";
import { useSession } from "next-auth/react";
import * as React from "react";
import { toast } from "sonner";

export default function NotificationsPage() {
	const [isPending, startTransition] = React.useTransition();
	const { data: session, status } = useSession();
	const [preferences, setPreferences] = React.useState({
		channels: {
			email: true,
			sms: false,
			push: false,
			slack: false,
		},
		types: {
			security: true,
			system: true,
			marketing: false,
			team: true,
		},
		schedule: {
			timezone: "UTC",
			quietHoursStart: "22:00",
			quietHoursEnd: "08:00",
			frequency: "instant",
		},
	});

	// Load preferences from API
	React.useEffect(() => {
		if (session?.user?.id) {
			startTransition(async () => {
				const result = await getNotificationPreferences();
				if (result.success && result.data) {
					setPreferences(result.data);
				}
			});
		}
	}, [session?.user?.id]);

	function handleChannelToggle(channel: keyof typeof preferences.channels) {
		if (isPending) return;

		const newChannels = {
			...preferences.channels,
			[channel]: !preferences.channels[channel],
		};

		startTransition(async () => {
			try {
				const result = await updateNotificationChannels(newChannels);
				if (!result.success) {
					toast.error(result.error ?? "Failed to update notification channels");
					return;
				}

				setPreferences((prev) => ({
					...prev,
					channels: newChannels,
				}));
				toast.success(result.message);
			} catch (error) {
				console.error("Channel toggle error:", error);
				toast.error("An unexpected error occurred");
			}
		});
	}

	function handleTypeToggle(type: keyof typeof preferences.types) {
		if (isPending) return;

		const newTypes = {
			...preferences.types,
			[type]: !preferences.types[type],
		};

		startTransition(async () => {
			try {
				const result = await updateNotificationTypes(newTypes);
				if (!result.success) {
					toast.error(result.error ?? "Failed to update notification types");
					return;
				}

				setPreferences((prev) => ({
					...prev,
					types: newTypes,
				}));
				toast.success(result.message);
			} catch (error) {
				console.error("Type toggle error:", error);
				toast.error("An unexpected error occurred");
			}
		});
	}

	function handleScheduleChange(
		field: keyof typeof preferences.schedule,
		value: string,
	) {
		if (isPending) return;

		const newSchedule = {
			...preferences.schedule,
			[field]: value,
		};

		startTransition(async () => {
			try {
				const result = await updateNotificationSchedule(newSchedule);
				if (!result.success) {
					toast.error(result.error ?? "Failed to update notification schedule");
					return;
				}

				setPreferences((prev) => ({
					...prev,
					schedule: newSchedule,
				}));
				toast.success(result.message);
			} catch (error) {
				console.error("Schedule update error:", error);
				toast.error("An unexpected error occurred");
			}
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Notifications</h3>
				<p className="text-sm text-muted-foreground">
					Manage how you receive notifications.
				</p>
			</div>
			<Separator />

			<Tabs defaultValue="channels" className="space-y-4">
				<TabsList>
					<TabsTrigger value="channels">Channels</TabsTrigger>
					<TabsTrigger value="types">Types</TabsTrigger>
					<TabsTrigger value="schedule">Schedule</TabsTrigger>
				</TabsList>

				<TabsContent value="channels" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Notification Channels</CardTitle>
							<CardDescription>
								Choose how you want to receive notifications.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{Object.entries(preferences.channels).map(
								([channel, enabled]) => (
									<div
										key={channel}
										className="flex items-center justify-between space-x-2"
									>
										<Label
											htmlFor={`channel-${channel}`}
											className="flex flex-col space-y-1"
										>
											<span className="capitalize">{channel}</span>
											<span className="text-sm font-normal text-muted-foreground">
												{channel === "email"
													? "Receive notifications via email"
													: channel === "sms"
														? "Get SMS alerts for important updates"
														: channel === "push"
															? "Browser push notifications"
															: "Receive notifications in Slack"}
											</span>
										</Label>
										<Switch
											id={`channel-${channel}`}
											checked={enabled}
											onCheckedChange={() =>
												handleChannelToggle(
													channel as keyof typeof preferences.channels,
												)
											}
											disabled={status === "loading" || isPending}
											aria-label={`${channel} notifications`}
										/>
									</div>
								),
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="types" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Notification Types</CardTitle>
							<CardDescription>
								Select which types of notifications you want to receive.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{Object.entries(preferences.types).map(([type, enabled]) => (
								<div
									key={type}
									className="flex items-center justify-between space-x-2"
								>
									<Label
										htmlFor={`type-${type}`}
										className="flex flex-col space-y-1"
									>
										<span className="capitalize">{type}</span>
										<span className="text-sm font-normal text-muted-foreground">
											{type === "security"
												? "Security alerts and warnings"
												: type === "system"
													? "System updates and maintenance"
													: type === "marketing"
														? "Product updates and announcements"
														: "Team and collaboration notifications"}
										</span>
									</Label>
									<Switch
										id={`type-${type}`}
										checked={enabled}
										onCheckedChange={() =>
											handleTypeToggle(type as keyof typeof preferences.types)
										}
										disabled={status === "loading" || isPending}
										aria-label={`${type} notifications`}
									/>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="schedule" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Notification Schedule</CardTitle>
							<CardDescription>
								Configure when you want to receive notifications.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label>Time Zone</Label>
								<Select
									value={preferences.schedule.timezone}
									onValueChange={(value) =>
										handleScheduleChange("timezone", value)
									}
									disabled={status === "loading" || isPending}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select your timezone" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="UTC">UTC</SelectItem>
										{/* TODO: Add more timezones */}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Quiet Hours</Label>
								<div className="flex items-center space-x-2">
									<TimeInput
										value={preferences.schedule.quietHoursStart}
										onChange={(value) =>
											handleScheduleChange("quietHoursStart", value)
										}
										disabled={status === "loading" || isPending}
									/>
									<span>to</span>
									<TimeInput
										value={preferences.schedule.quietHoursEnd}
										onChange={(value) =>
											handleScheduleChange("quietHoursEnd", value)
										}
										disabled={status === "loading" || isPending}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Notification Frequency</Label>
								<Select
									value={preferences.schedule.frequency}
									onValueChange={(value) =>
										handleScheduleChange("frequency", value)
									}
									disabled={status === "loading" || isPending}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select frequency" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="instant">Instant</SelectItem>
										<SelectItem value="daily">Daily Digest</SelectItem>
										<SelectItem value="weekly">Weekly Summary</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

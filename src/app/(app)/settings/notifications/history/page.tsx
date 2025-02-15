"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getNotificationHistory } from "@/server/actions/notifications";
import { notificationChannelType, notificationType } from "@/server/db/schema";
import { formatDistanceToNow } from "date-fns";
import { Download, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { toast } from "sonner";

interface NotificationHistoryItem {
	id: string;
	type: (typeof notificationType.enumValues)[number];
	channel: (typeof notificationChannelType.enumValues)[number];
	title: string;
	content: string;
	status: string;
	sentAt: Date;
	deliveredAt?: Date | null;
	error?: string | null;
}

export default function NotificationHistoryPage() {
	const [isPending, startTransition] = React.useTransition();
	const { data: session, status } = useSession();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedType, setSelectedType] = React.useState<string>("all");
	const [selectedChannel, setSelectedChannel] = React.useState<string>("all");
	const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
	const [history, setHistory] = React.useState<NotificationHistoryItem[]>([]);

	// Load notification history
	React.useEffect(() => {
		if (session?.user?.id) {
			startTransition(async () => {
				const result = await getNotificationHistory({
					type: selectedType === "all" ? undefined : (selectedType as any),
					channel:
						selectedChannel === "all" ? undefined : (selectedChannel as any),
					status:
						selectedStatus === "all" ? undefined : (selectedStatus as any),
					search: searchQuery || undefined,
					limit: 50,
				});

				if (result.success && result?.data) {
					setHistory(result.data);
				} else {
					toast.error(result.error ?? "Failed to load notification history");
				}
			});
		}
	}, [
		session?.user?.id,
		selectedType,
		selectedChannel,
		selectedStatus,
		searchQuery,
	]);

	// Filter history based on search and filters
	const filteredHistory = history;

	// Handle export
	const handleExport = () => {
		const csv = [
			[
				"Type",
				"Channel",
				"Title",
				"Content",
				"Status",
				"Sent At",
				"Delivered At",
				"Error",
			],
			...filteredHistory.map((item) => [
				item.type,
				item.channel,
				item.title,
				item.content,
				item.status,
				item.sentAt.toISOString(),
				item.deliveredAt?.toISOString() ?? "",
				item.error ?? "",
			]),
		]
			.map((row) => row.map((cell) => `"${cell}"`).join(","))
			.join("\n");

		const blob = new Blob([csv], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "notification-history.csv";
		a.click();
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Notification History</h3>
				<p className="text-sm text-muted-foreground">
					View and search your notification history.
				</p>
			</div>
			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>History</CardTitle>
					<CardDescription>
						Search and filter your notification history.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Search and Filters */}
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-1 items-center space-x-2">
							<Search className="h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search notifications..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="max-w-sm"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Select value={selectedType} onValueChange={setSelectedType}>
								<SelectTrigger className="w-[130px]">
									<SelectValue placeholder="Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Types</SelectItem>
									{notificationType.enumValues.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={selectedChannel}
								onValueChange={setSelectedChannel}
							>
								<SelectTrigger className="w-[130px]">
									<SelectValue placeholder="Channel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Channels</SelectItem>
									{notificationChannelType.enumValues.map((channel) => (
										<SelectItem key={channel} value={channel}>
											{channel.charAt(0).toUpperCase() + channel.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select value={selectedStatus} onValueChange={setSelectedStatus}>
								<SelectTrigger className="w-[130px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="sent">Sent</SelectItem>
									<SelectItem value="delivered">Delivered</SelectItem>
									<SelectItem value="failed">Failed</SelectItem>
								</SelectContent>
							</Select>

							<Button
								variant="outline"
								size="icon"
								onClick={handleExport}
								disabled={filteredHistory.length === 0}
								title="Export to CSV"
							>
								<Download className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* History Table */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Type</TableHead>
									<TableHead>Channel</TableHead>
									<TableHead>Title</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Sent</TableHead>
									<TableHead>Delivered</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredHistory.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-24 text-center text-muted-foreground"
										>
											No notifications found
										</TableCell>
									</TableRow>
								) : (
									filteredHistory.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-medium">
												<Badge variant="outline">{item.type}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{item.channel}</Badge>
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span>{item.title}</span>
													<span className="text-sm text-muted-foreground">
														{item.content}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														item.status === "delivered"
															? "outline"
															: item.status === "sent"
																? "default"
																: "destructive"
													}
												>
													{item.status}
												</Badge>
											</TableCell>
											<TableCell>
												{formatDistanceToNow(item.sentAt, { addSuffix: true })}
											</TableCell>
											<TableCell>
												{item.deliveredAt
													? formatDistanceToNow(item.deliveredAt, {
														addSuffix: true,
													})
													: (item.error ?? "-")}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

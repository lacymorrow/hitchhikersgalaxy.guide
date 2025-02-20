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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { createNotificationTemplate, deleteNotificationTemplate, getNotificationTemplates } from "@/server/actions/notifications";
import { notificationChannelType, notificationType } from "@/server/db/schema";
import { Plus, Search, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import * as React from "react";
import { toast } from "sonner";

interface NotificationTemplate {
	id: string;
	name: string;
	description?: string;
	type: (typeof notificationType.enumValues)[number];
	channel: (typeof notificationChannelType.enumValues)[number];
	subject?: string;
	content: string;
	variables: string[];
}

export default function NotificationTemplatesPage() {
	const [isPending, startTransition] = React.useTransition();
	const { data: session, status } = useSession();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedType, setSelectedType] = React.useState<string>("all");
	const [selectedChannel, setSelectedChannel] = React.useState<string>("all");
	const [templates, setTemplates] = React.useState<NotificationTemplate[]>([]);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
	const [newTemplate, setNewTemplate] = React.useState<
		Partial<NotificationTemplate>
	>({
		variables: [],
	});

	// Load templates
	React.useEffect(() => {
		if (session?.user?.id) {
			startTransition(async () => {
				const result = await getNotificationTemplates({
					type: selectedType === "all" ? undefined : (selectedType as any),
					channel:
						selectedChannel === "all" ? undefined : (selectedChannel as any),
					search: searchQuery || undefined,
				});

				if (result.success && result?.data) {
					setTemplates(result.data as any);
				} else {
					toast.error(result.error ?? "Failed to load templates");
				}
			});
		}
	}, [session?.user?.id, selectedType, selectedChannel, searchQuery]);

	// Filter templates
	const filteredTemplates = React.useMemo(() => {
		return templates.filter((template) => {
			const matchesSearch =
				searchQuery === "" ||
				template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				template.description?.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesType =
				selectedType === "all" || template.type === selectedType;
			const matchesChannel =
				selectedChannel === "all" || template.channel === selectedChannel;

			return matchesSearch && matchesType && matchesChannel;
		});
	}, [templates, searchQuery, selectedType, selectedChannel]);

	// Handle template creation
	const handleCreateTemplate = async () => {
		if (
			!newTemplate.name ||
			!newTemplate.type ||
			!newTemplate.channel ||
			!newTemplate.content
		) {
			toast.error("Please fill in all required fields");
			return;
		}

		startTransition(async () => {
			try {
				const result = await createNotificationTemplate(newTemplate as any);
				if (result.success) {
					setTemplates((prev) => [...prev, result.data as any]);
					setIsCreateDialogOpen(false);
					setNewTemplate({ variables: [] });
					toast.success("Template created successfully");
				} else {
					toast.error(result.error ?? "Failed to create template");
				}
			} catch (error) {
				toast.error("Failed to create template");
			}
		});
	};

	// Handle template deletion
	const handleDeleteTemplate = async (templateId: string) => {
		startTransition(async () => {
			try {
				const result = await deleteNotificationTemplate(templateId);
				if (result.success) {
					setTemplates((prev) => prev.filter((t) => t.id !== templateId));
					toast.success("Template deleted successfully");
				} else {
					toast.error(result.error ?? "Failed to delete template");
				}
			} catch (error) {
				toast.error("Failed to delete template");
			}
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Notification Templates</h3>
				<p className="text-sm text-muted-foreground">
					Manage your notification templates.
				</p>
			</div>
			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>Templates</CardTitle>
					<CardDescription>
						Create and manage notification templates.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Search and Filters */}
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-1 items-center space-x-2">
							<Search
								className="h-4 w-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<Input
								placeholder="Search templates..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="max-w-sm"
								aria-label="Search templates"
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

							<Dialog
								open={isCreateDialogOpen}
								onOpenChange={setIsCreateDialogOpen}
								aria-labelledby="create-template-dialog-title"
								aria-describedby="create-template-dialog-description"
							>
								<DialogTrigger asChild>
									<Button>
										<Plus className="mr-2 h-4 w-4" aria-hidden="true" />
										<span>New Template</span>
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle id="create-template-dialog-title">
											Create Template
										</DialogTitle>
										<DialogDescription id="create-template-dialog-description">
											Create a new notification template.
										</DialogDescription>
									</DialogHeader>

									<div className="grid gap-4 py-4">
										<div className="space-y-2">
											<Label htmlFor="name">Name</Label>
											<Input
												id="name"
												value={newTemplate.name ?? ""}
												onChange={(e) =>
													setNewTemplate((prev) => ({
														...prev,
														name: e.target.value,
													}))
												}
												placeholder="Template name"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="description">Description</Label>
											<Input
												id="description"
												value={newTemplate.description ?? ""}
												onChange={(e) =>
													setNewTemplate((prev) => ({
														...prev,
														description: e.target.value,
													}))
												}
												placeholder="Template description"
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>Type</Label>
												<Select
													value={newTemplate.type}
													onValueChange={(value) =>
														setNewTemplate((prev) => ({
															...prev,
															type: value as any,
														}))
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select type" />
													</SelectTrigger>
													<SelectContent>
														{notificationType.enumValues.map((type) => (
															<SelectItem key={type} value={type}>
																{type.charAt(0).toUpperCase() + type.slice(1)}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label>Channel</Label>
												<Select
													value={newTemplate.channel}
													onValueChange={(value) =>
														setNewTemplate((prev) => ({
															...prev,
															channel: value as any,
														}))
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select channel" />
													</SelectTrigger>
													<SelectContent>
														{notificationChannelType.enumValues.map(
															(channel) => (
																<SelectItem key={channel} value={channel}>
																	{channel.charAt(0).toUpperCase() +
																		channel.slice(1)}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>
										</div>

										{newTemplate.channel === "email" && (
											<div className="space-y-2">
												<Label htmlFor="subject">Subject</Label>
												<Input
													id="subject"
													value={newTemplate.subject ?? ""}
													onChange={(e) =>
														setNewTemplate((prev) => ({
															...prev,
															subject: e.target.value,
														}))
													}
													placeholder="Email subject"
												/>
											</div>
										)}

										<div className="space-y-2">
											<Label htmlFor="content">Content</Label>
											<Textarea
												id="content"
												value={newTemplate.content ?? ""}
												onChange={(e) =>
													setNewTemplate((prev) => ({
														...prev,
														content: e.target.value,
													}))
												}
												placeholder="Template content"
												rows={6}
											/>
											<p className="text-xs text-muted-foreground">
												Use {"{ variable_name }"} for dynamic content
											</p>
										</div>

										<div className="space-y-2">
											<Label htmlFor="variables">Variables</Label>
											<Input
												id="variables"
												placeholder="Add variable (press Enter)"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const value = e.currentTarget.value.trim();
														if (
															value &&
															!newTemplate.variables?.includes(value)
														) {
															setNewTemplate((prev) => ({
																...prev,
																variables: [...(prev.variables ?? []), value],
															}));
															e.currentTarget.value = "";
														}
													}
												}}
											/>
											<div className="mt-2 flex flex-wrap gap-2">
												{newTemplate.variables?.map((variable) => (
													<Badge
														key={variable}
														variant="secondary"
														className="cursor-pointer"
														onClick={() =>
															setNewTemplate((prev) => ({
																...prev,
																variables: prev.variables?.filter(
																	(v) => v !== variable,
																),
															}))
														}
													>
														{variable}
														<Trash className="ml-1 h-3 w-3" />
													</Badge>
												))}
											</div>
										</div>
									</div>

									<DialogFooter>
										<Button
											variant="outline"
											onClick={() => setIsCreateDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button onClick={handleCreateTemplate} disabled={isPending}>
											{isPending ? "Creating..." : "Create Template"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</div>

					{/* Templates Table */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Channel</TableHead>
									<TableHead>Variables</TableHead>
									<TableHead className="w-[100px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredTemplates.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											className="h-24 text-center text-muted-foreground"
										>
											No templates found
										</TableCell>
									</TableRow>
								) : (
									filteredTemplates.map((template) => (
										<TableRow key={template.id}>
											<TableCell>
												<div className="flex flex-col">
													<span className="font-medium">{template.name}</span>
													{template.description && (
														<span className="text-sm text-muted-foreground">
															{template.description}
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline">{template.type}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant="secondary">{template.channel}</Badge>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{template.variables.map((variable) => (
														<Badge key={variable} variant="outline">
															{variable}
														</Badge>
													))}
												</div>
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDeleteTemplate(template.id)}
													aria-label={`Delete template ${template.name}`}
												>
													<Trash className="h-4 w-4" aria-hidden="true" />
												</Button>
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

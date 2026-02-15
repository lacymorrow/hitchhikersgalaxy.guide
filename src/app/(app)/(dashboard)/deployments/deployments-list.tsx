"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardVercelDeploy } from "@/components/modules/deploy/dashboard-vercel-deploy";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table/data-table";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import type { Deployment } from "@/server/db/schema";
import { DeploymentActions } from "./deployment-actions";

// Constants for polling configuration
const POLLING_INTERVAL_MS = 3000; // 3 seconds
const STALE_DEPLOYMENT_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes - same as server

/**
 * Check if a deployment is actively deploying (not stale)
 * We only poll for deployments that started within the last 10 minutes
 */
function isActivelyDeploying(deployment: Deployment): boolean {
	if (deployment.status !== "deploying") return false;
	const createdAt = new Date(deployment.createdAt).getTime();
	const now = Date.now();
	return now - createdAt < STALE_DEPLOYMENT_THRESHOLD_MS;
}

interface DeploymentsListProps {
	deployments: Deployment[];
}

async function fetchDeployments(): Promise<Deployment[]> {
	const response = await fetch("/api/deployments");
	if (!response.ok) {
		throw new Error("Failed to fetch deployments");
	}
	const data = await response.json();
	return data.deployments;
}

export function DeploymentsList({ deployments: initialDeployments }: DeploymentsListProps) {
	const [hasActiveDeployments, setHasActiveDeployments] = useState(
		initialDeployments.some(isActivelyDeploying)
	);
	// Counter to force re-renders for timestamp updates
	const [, setTick] = useState(0);

	// Use React Query for efficient polling
	// Only poll if there are actively deploying items (not stale ones)
	const { data: deployments = initialDeployments } = useQuery({
		queryKey: ["deployments"],
		queryFn: fetchDeployments,
		initialData: initialDeployments,
		refetchInterval: hasActiveDeployments ? POLLING_INTERVAL_MS : false,
		refetchIntervalInBackground: true,
		staleTime: 1000, // Consider data stale after 1 second
	});

	// Update polling state when deployments change
	// Only poll for fresh deployments, not stale ones stuck for hours/days
	useEffect(() => {
		const shouldPoll = deployments.some(isActivelyDeploying);
		setHasActiveDeployments(shouldPoll);
	}, [deployments]);

	// Live-update timestamps every second while there are active deployments
	useEffect(() => {
		if (!hasActiveDeployments) return;
		const interval = setInterval(() => {
			setTick((t) => t + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [hasActiveDeployments]);
	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle2 className="h-4 w-4 text-green-500" />;
			case "failed":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			case "deploying":
				return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
			case "timeout":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return null;
		}
	};

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case "completed":
				return "default" as const;
			case "failed":
				return "destructive" as const;
			case "deploying":
				return "secondary" as const;
			case "timeout":
				return "outline" as const;
			default:
				return "outline" as const;
		}
	};

	const columns: ColumnDef<Deployment>[] = [
		{
			accessorKey: "projectName",
			header: "Project",
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<Rocket className="h-4 w-4 text-muted-foreground" />
					<span className="font-medium">{row.original.projectName}</span>
				</div>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<Badge
					variant={getStatusBadgeVariant(row.original.status)}
					className="flex items-center gap-1 w-fit"
				>
					{getStatusIcon(row.original.status)}
					<span className="capitalize">{row.original.status}</span>
				</Badge>
			),
		},
		{
			accessorKey: "description",
			header: "Description",
			cell: ({ row }) => (
				<div>
					<span className="text-muted-foreground">
						{row.original.description ?? "No description"}
					</span>
					{row.original.status === "failed" && row.original.error && (
						<div className="mt-1">
							<span className="text-xs text-red-600 dark:text-red-400">
								Error: {row.original.error}
							</span>
						</div>
					)}
				</div>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Deployed",
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
				</span>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => <DeploymentActions deployment={row.original} />,
		},
	];

	return (
		<>
			{deployments.length === 0 ? (
				<div className="text-center py-12 bg-muted/50 rounded-lg">
					<Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 className="text-lg font-semibold mb-2">No deployments yet</h3>
					<p className="text-muted-foreground mb-6">
						Deploy your first {siteConfig.title} instance to get started
					</p>
					<DashboardVercelDeploy />
				</div>
			) : (
				<DataTable
					columns={columns}
					data={deployments}
					className={cn("[&_td]:py-3", "[&_th]:font-semibold", "[&_tr]:border-b")}
				/>
			)}
		</>
	);
}

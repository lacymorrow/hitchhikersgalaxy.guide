"use client";

import { FolderSyncIcon, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsyncAction } from "@/hooks/use-async-state";
import { useToast } from "@/hooks/use-toast";
import { deleteAllPayments, importPayments, refreshAllPayments } from "@/server/actions/payments";

type PaymentProvider = "lemonsqueezy" | "polar" | "stripe" | "all";
type ActionType = "import" | "delete" | "refresh";

interface SingleProviderResult {
	total: number;
	imported: number;
	skipped: number;
	errors: number;
	usersCreated: number;
}

interface AllProvidersResult {
	lemonsqueezy: SingleProviderResult;
	polar: SingleProviderResult;
	stripe: SingleProviderResult;
}

/**
 * Formats the import result message based on the provider and result data
 */
const formatImportMessage = (provider: PaymentProvider, result: unknown): string => {
	if (provider === "all") {
		const allResult = result as AllProvidersResult;
		return `
			Lemon Squeezy: ${allResult.lemonsqueezy.imported} imported, ${allResult.lemonsqueezy.skipped} skipped, ${allResult.lemonsqueezy.errors} errors, ${allResult.lemonsqueezy.usersCreated} users created.
			Polar: ${allResult.polar.imported} imported, ${allResult.polar.skipped} skipped, ${allResult.polar.errors} errors, ${allResult.polar.usersCreated} users created.
			Stripe: ${allResult.stripe.imported} imported, ${allResult.stripe.skipped} skipped, ${allResult.stripe.errors} errors, ${allResult.stripe.usersCreated} users created.
		`.trim();
	}

	const singleResult = result as SingleProviderResult;
	return `${singleResult.imported} imported, ${singleResult.skipped} skipped, ${singleResult.errors} errors, ${singleResult.usersCreated} users created.`;
};

/**
 * Component to import users and payments from payment providers
 */
export function ImportPayments() {
	const { toast } = useToast();
	const [currentProvider, setCurrentProvider] = useState<PaymentProvider | null>(null);
	const [currentAction, setCurrentAction] = useState<ActionType | null>(null);

	const { loading, error, execute } = useAsyncAction(
		async (action: ActionType, provider?: PaymentProvider) => {
			setCurrentAction(action);

			if (action === "import" && provider) {
				setCurrentProvider(provider);
				const result = await importPayments(provider);

				// Show success toast
				toast({
					title: `${provider === "all" ? "All payments" : provider} import complete`,
					description: formatImportMessage(provider, result),
					variant: "default",
				});
			} else if (action === "delete") {
				const result = await deleteAllPayments();

				// Show success toast
				toast({
					title: "All payments deleted",
					description: result.message || `Successfully deleted ${result.deletedCount} payments`,
					variant: "default",
				});
			} else if (action === "refresh") {
				const result = await refreshAllPayments();

				// Show success toast
				toast({
					title: "All payments refreshed",
					description:
						result.message ||
						`Successfully refreshed payments: deleted ${result.deletedCount} old payments and imported fresh data`,
					variant: "default",
				});
			}

			setCurrentProvider(null);
			setCurrentAction(null);
		}
	);

	// Show error toast when error occurs
	if (error) {
		toast({
			title: `${currentAction === "import" ? "Import" : currentAction === "delete" ? "Delete" : "Refresh"} failed`,
			description: error,
			variant: "destructive",
		});
	}

	/**
	 * Handles the import process for a specific provider
	 */
	const handleImport = (provider: PaymentProvider) => {
		execute("import", provider).catch((err: Error) => {
			console.error("Error importing payments", err);
			setCurrentProvider(null);
			setCurrentAction(null);
		});
	};

	/**
	 * Handles the delete all payments process
	 */
	const handleDeleteAll = () => {
		execute("delete").catch((err: Error) => {
			console.error("Error deleting payments", err);
			setCurrentAction(null);
		});
	};

	/**
	 * Handles the refresh all payments process
	 */
	const handleRefreshAll = () => {
		execute("refresh").catch((err: Error) => {
			console.error("Error refreshing payments", err);
			setCurrentAction(null);
		});
	};

	/**
	 * Gets the loading text based on current action
	 */
	const getLoadingText = () => {
		if (currentAction === "import") {
			return `Importing ${currentProvider}...`;
		}
		if (currentAction === "delete") {
			return "Deleting all payments...";
		}
		if (currentAction === "refresh") {
			return "Refreshing all payments...";
		}
		return "Processing...";
	};

	/**
	 * Gets the loading icon based on current action
	 */
	const getLoadingIcon = () => {
		if (currentAction === "import") {
			return <FolderSyncIcon className="mr-2 h-4 w-4" />;
		}
		if (currentAction === "delete") {
			return <Trash2 className="mr-2 h-4 w-4" />;
		}
		if (currentAction === "refresh") {
			return <RotateCcw className="mr-2 h-4 w-4" />;
		}
		return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="sm" disabled={loading}>
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{getLoadingText()}
						</>
					) : (
						<>
							<FolderSyncIcon className="mr-2 h-4 w-4" />
							Payment Actions
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Import Payments</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => handleImport("lemonsqueezy")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import Lemon Squeezy
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleImport("polar")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import Polar
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleImport("stripe")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import Stripe
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleImport("all")} disabled={loading}>
					<FolderSyncIcon className="mr-2 h-4 w-4" />
					Import All Providers
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>Manage Payments</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleRefreshAll} disabled={loading}>
					<RotateCcw className="mr-2 h-4 w-4" />
					Refresh All Payments
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={handleDeleteAll}
					disabled={loading}
					className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete All Payments
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

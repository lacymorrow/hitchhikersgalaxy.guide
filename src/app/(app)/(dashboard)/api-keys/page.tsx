import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { auth } from "@/server/auth";
import { apiKeyService } from "@/server/services/api-key-service";
import { cacheConfigs, cacheService } from "@/server/services/cache-service";
import { ErrorService } from "@/server/services/error-service";
import { AlertCircleIcon } from "lucide-react";
import { ApiKeysTable } from "./_components/api-keys-table";

export default async function ApiKeysPage() {
	const session = await auth();
	const user = session?.user;

	if (!user) {
		return <div>Please sign in to view API keys.</div>;
	}

	try {
		// Get user's API keys with caching
		const userApiKeys = await cacheService.getOrSet(
			`user:${user.id}:api-keys`,
			() => apiKeyService.getUserApiKeys(user.id),
			cacheConfigs.short,
		);[]

		// Filter out deleted API keys and map to the format expected by DataTable
		const activeApiKeys = userApiKeys
			.filter(({ apiKey }) => !apiKey.deletedAt)
			.map(({ apiKey }) => ({
				...apiKey,
				createdAt: new Date(apiKey.createdAt),
				lastUsedAt: apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt) : null,
				expiresAt: apiKey.expiresAt ? new Date(apiKey.expiresAt) : null,
			}));

		return (
			<div className="container mx-auto py-10">
				<div className="mb-8">
					<h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
					<p className="text-muted-foreground">
						Manage your API keys. Keep these secure and never share them publicly.
					</p>
				</div>

				<ApiKeysTable apiKeys={activeApiKeys} userId={user.id} />
			</div>
		);
	} catch (error) {
		// Handle errors gracefully
		const appError = ErrorService.handleError(error);
		return (
			<div className="container mx-auto py-10">
				<Alert>
					<AlertCircleIcon className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>
						{appError.message}
					</AlertDescription>
				</Alert>
			</div>
		);
	}
}

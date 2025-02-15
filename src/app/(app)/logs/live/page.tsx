import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";
import { apiKeyService } from "@/server/services/api-key-service";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LiveLogs } from "../_components/live-logs";

export default async function LiveLogsPage() {
	const session = await auth();
	if (!session?.user) {
		return redirect(routes.auth.signIn);
	}

	try {
		const apiKeysData = await apiKeyService.getUserApiKeys(session.user.id);
		const apiKeys = apiKeysData.map((data) => data.apiKey);

		if (apiKeys.length === 0) {
			return (
				<div className="container mx-auto py-10">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>No API Keys Found</AlertTitle>
						<AlertDescription>
							You don't have any API keys yet. Create one to start viewing logs.
							<div className="mt-4">
								<Link
									href={routes.app.apiKeys}
									className={buttonVariants({ variant: "outline" })}
								>
									Create API Key
								</Link>
							</div>
						</AlertDescription>
					</Alert>
				</div>
			);
		}

		return (
			<div className="container mx-auto py-10">
				<div className="mb-8">
					<h1 className="text-2xl font-bold tracking-tight">Live Logs</h1>
					<p className="text-muted-foreground">
						View your application logs in real-time. Select an API key to start
						streaming logs.
					</p>
				</div>

				<LiveLogs apiKeys={apiKeys} />
			</div>
		);
	} catch (error) {
		return (
			<div className="container mx-auto py-10">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>
						Failed to load API keys. Please try again later.
					</AlertDescription>
				</Alert>
			</div>
		);
	}
}

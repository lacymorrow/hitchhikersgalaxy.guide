import { redirect } from "next/navigation";
import { DeleteAccountCard } from "@/app/(app)/settings/_components/delete-account-card";
import { GitHubConnectDialog } from "@/components/buttons/github-connect-dialog";
import { VercelConnectButton } from "@/components/shipkit/vercel-connect-button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/server/auth";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";

export default async function AccountPage() {
	const session = await auth();
	if (!session?.user) redirect("/login");

	const userId = session.user.id;

	// Check if user has connected Vercel using our server-side function
	const hasVercelConnection = await checkVercelConnection(userId);

	// Define the connected accounts based on session data
	const connectedAccounts = [
		{
			name: "GitHub",
			connected: !!session?.user?.githubUsername,
			username: session?.user?.githubUsername,
		},
		{
			name: "GitLab",
			connected: false,
			username: null,
		},
		{
			name: "Bitbucket",
			connected: false,
			username: null,
		},
		// Add more providers here as they become available
	];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Account</h3>
				<p className="text-sm text-muted-foreground">Manage your account settings.</p>
			</div>
			<Separator />

			{/* Vercel Connection */}
			<Card>
				<CardHeader>
					<CardTitle>Vercel Connection</CardTitle>
					<CardDescription>
						Connect your Vercel account to deploy projects directly.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<p>
							{hasVercelConnection
								? "Your Vercel account is connected. You can now deploy projects directly to Vercel."
								: "Connect your Vercel account to deploy projects directly from Shipkit."}
						</p>
					</div>
				</CardContent>
				<CardFooter>
					<VercelConnectButton user={session?.user} className="w-full" />
				</CardFooter>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>GitHub Connection</CardTitle>
					<CardDescription>Connect your GitHub account to access the repository.</CardDescription>
				</CardHeader>
				<CardContent>
					<GitHubConnectDialog />
				</CardContent>
			</Card>

			{/* Connected Accounts */}
			{/* <Card>
				<CardHeader>
					<CardTitle>Connected Accounts</CardTitle>
					<CardDescription>
						Manage your connected accounts and authentication methods.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{connectedAccounts.map((account) => (
						<div
							key={account.name}
							className="flex items-center justify-between space-x-4"
						>
							<div className="flex flex-col space-y-1">
								<span className="font-medium">{account.name}</span>
								{account.connected ? (
									<span className="text-sm text-muted-foreground">
										Connected as {account.username}
									</span>
								) : (
									<span className="text-sm text-muted-foreground">
										Not connected
									</span>
								)}
							</div>
							<Button
								onClick={() => {

								}}
								variant={account.connected ? "outline" : "default"}
								disabled={!account.name.toLowerCase().includes("github")}
							>
								{account.connected ? "Disconnect" : "Connect"}
							</Button>
						</div>
					))}
				</CardContent>
			</Card> */}

			{/* Delete Account */}
			<DeleteAccountCard />
		</div>
	);
}

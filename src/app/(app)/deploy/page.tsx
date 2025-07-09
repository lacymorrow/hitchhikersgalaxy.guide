import { AlertCircle, ArrowRight, CheckCircle, ExternalLink, Github, Zap } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PrivateRepoDeployButton } from "@/components/deploy/private-repo-deploy-button";
import { VercelConnectionCard } from "@/components/deploy/vercel-connection-card";
import { VercelConnectButton } from "@/components/shipkit/vercel-connect-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/server/auth";
import { checkVercelConnection } from "@/server/services/vercel/vercel-service";

export const metadata: Metadata = {
	title: "Deploy Private Repository",
	description: "Deploy private GitHub repositories to your Vercel account with one click",
};

export default async function DeployPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	// Check if user has connected their Vercel account
	const hasVercelConnection = await checkVercelConnection(session.user.id);

	return (
		<div className="container mx-auto py-8 space-y-8">
			{/* Header */}
			<div className="text-center space-y-4">
				<div className="flex items-center justify-center gap-2 mb-4">
					<Github className="h-8 w-8 text-muted-foreground" />
					<ArrowRight className="h-6 w-6 text-muted-foreground" />
					<Zap className="h-8 w-8 text-muted-foreground" />
				</div>
				<h1 className="text-4xl font-bold tracking-tight">Deploy Private Repository</h1>
				<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
					Deploy private GitHub repository templates to your accounts with automated Vercel setup
				</p>
			</div>

			{/* Status Cards */}
			<div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
				{/* GitHub Status */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<Github className="h-5 w-5" />
							GitHub Integration
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-4 w-4 text-green-500" />
							<span className="text-sm">Ready for private repository access</span>
						</div>
						<p className="text-xs text-muted-foreground">
							You'll provide a GitHub personal access token to access private templates during
							deployment.
						</p>
						<Button variant="ghost" size="sm" asChild>
							<a
								href="https://github.com/settings/tokens"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-1"
							>
								<ExternalLink className="h-3 w-3" />
								Create GitHub Token
							</a>
						</Button>
					</CardContent>
				</Card>

				{/* Vercel Status */}
				<Suspense fallback={<div className="animate-pulse bg-muted h-32 rounded-lg"></div>}>
					<VercelConnectionCard hasVercelConnection={hasVercelConnection} user={session.user} />
				</Suspense>
			</div>

			{/* Main Content */}
			<div className="max-w-4xl mx-auto space-y-6">
				{!hasVercelConnection && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>Vercel account required:</strong> Please connect your Vercel account above
							before deploying repositories. This allows the system to automatically create projects
							and deployments on your behalf.
						</AlertDescription>
					</Alert>
				)}

				{/* How It Works */}
				<Card>
					<CardHeader>
						<CardTitle>How It Works</CardTitle>
						<CardDescription>
							This system bypasses Vercel's private repository limitation by creating a public copy
							and setting up deployment automatically.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-4">
							<div className="text-center space-y-2">
								<div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-sm font-medium">
									1
								</div>
								<h4 className="font-medium text-sm">Access Template</h4>
								<p className="text-xs text-muted-foreground">
									Use your GitHub token to access the private template repository
								</p>
							</div>
							<div className="text-center space-y-2">
								<div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-sm font-medium">
									2
								</div>
								<h4 className="font-medium text-sm">Create Repository</h4>
								<p className="text-xs text-muted-foreground">
									Create a new public repository from the template on your GitHub account
								</p>
							</div>
							<div className="text-center space-y-2">
								<div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-sm font-medium">
									3
								</div>
								<h4 className="font-medium text-sm">Setup Vercel</h4>
								<p className="text-xs text-muted-foreground">
									Automatically create Vercel project and configure environment variables
								</p>
							</div>
							<div className="text-center space-y-2">
								<div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-sm font-medium">
									4
								</div>
								<h4 className="font-medium text-sm">Deploy</h4>
								<p className="text-xs text-muted-foreground">
									Trigger initial deployment and provide live links to your new project
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Separator />

				{/* Deploy Component */}
				<Suspense
					fallback={
						<div className="flex items-center justify-center py-8">Loading deployment form...</div>
					}
				>
					<PrivateRepoDeployButton />
				</Suspense>

				{/* Features */}
				<Card>
					<CardHeader>
						<CardTitle>Features</CardTitle>
						<CardDescription>
							Everything you need for seamless private repository deployment
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-3">
								<h4 className="font-medium">Automated Setup</h4>
								<ul className="space-y-1 text-sm text-muted-foreground">
									<li>• GitHub repository creation from template</li>
									<li>• Vercel project configuration</li>
									<li>• Environment variable setup</li>
									<li>• Initial deployment trigger</li>
								</ul>
							</div>
							<div className="space-y-3">
								<h4 className="font-medium">Security & Control</h4>
								<ul className="space-y-1 text-sm text-muted-foreground">
									<li>• Secure OAuth token handling</li>
									<li>• Private template access</li>
									<li>• User-owned repositories</li>
									<li>• Full deployment control</li>
								</ul>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Requirements */}
				<Card>
					<CardHeader>
						<CardTitle>Requirements</CardTitle>
						<CardDescription>What you need to deploy private repositories</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-start gap-3">
								<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
								<div>
									<h4 className="font-medium">GitHub Personal Access Token</h4>
									<p className="text-sm text-muted-foreground">
										A token with <code>repo</code> permissions to access private template
										repositories.
										<a
											href="https://github.com/settings/tokens"
											target="_blank"
											rel="noopener noreferrer"
											className="text-blue-500 hover:underline ml-1"
										>
											Create one here
										</a>
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
								<div>
									<h4 className="font-medium">Connected Vercel Account</h4>
									<p className="text-sm text-muted-foreground">
										Your Vercel account must be connected in Settings to enable automatic project
										creation and deployment.
									</p>
								</div>
							</div>
							<div className="flex items-start gap-3">
								<div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
								<div>
									<h4 className="font-medium">Template Repository Access</h4>
									<p className="text-sm text-muted-foreground">
										You must have access to the private repository you want to use as a template.
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// import { VercelDeployButton } from "@/components/buttons/vercel-deploy-button";
import { Link } from "@/components/primitives/link-with-transition";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CodeWindow } from "@/components/ui/code-window";
import { GitHubConnectButton } from "@/components/ui/github-connect-button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { downloadRepo } from "@/server/actions/github/download-repo";
import { auth } from "@/server/auth";
import { checkGitHubConnection } from "@/server/services/github/github-service";
import { PaymentService } from "@/server/services/payment-service";
import { CreditCardIcon, DownloadIcon, UserIcon } from "lucide-react";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

const installationCode = `# Clone the repository
git clone ${siteConfig.repo.url}

# Change directory
cd shipkit

# Install dependencies
pnpm install

# Start the development server
pnpm dev`;

const dockerCode = `# Clone the repository
git clone ${siteConfig.repo.url}

# Change directory
cd shipkit

# Build the Docker image
docker build -t shipkit .

# Run the container
docker run -p 3000:3000 shipkit`;

export default async function DownloadPage() {
	const session = await auth();
	if (!session?.user?.email) {
		redirect("/auth/signin");
	}

	const hasPurchased = await PaymentService.getUserPaymentStatus(session.user.id);
	if (!hasPurchased) {
		redirect("/pricing");
	}

	return (
		<main>
			<div className="container flex min-h-[50vh] flex-col items-center justify-center space-y-4">
				<Card className="w-full max-w-screen-sm">
					<CardHeader>
						<CardTitle>Download {siteConfig.name}</CardTitle>
						<CardDescription>
							Download the latest version of {siteConfig.name} directly, or
							connect your GitHub account to get automatic updates, features,
							and support!
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 justify-center items-center">
						{/* <VercelConnectButton />
						<VercelDeployButton /> */}
						<DownloadPageContent session={session} />
					</CardContent>
					<CardFooter className="flex justify-center">

					</CardFooter>
				</Card>
			</div>
		</main>
	);
}

async function DownloadPageContent({ session }: { session: Session | null }) {
	if (!session?.user?.id || !session?.user?.email) {
		return (
			<Link
				href={routes.auth.signIn}
				className={buttonVariants({ variant: "default", size: "lg" })}
			>
				<UserIcon className="mr-2 h-4 w-4" />
				Sign in
			</Link>
		);
	}

	const hasPurchased = await PaymentService.getUserPaymentStatus(session.user.id);
	if (!hasPurchased) {
		return (
			<div className="container flex min-h-[50vh] flex-col items-center justify-center space-y-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Purchase Required</CardTitle>
						<CardDescription>
							Purchase {siteConfig.name} to get started with our premium
							features
						</CardDescription>
					</CardHeader>
					<CardContent className="flex justify-center">
						<Link
							href={routes.external.buy}
							className={buttonVariants({ variant: "default", size: "lg" })}
						>
							<CreditCardIcon className="mr-2 h-4 w-4" />
							Purchase Now
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	const hasGitHubConnection = await checkGitHubConnection(session.user.id);

	return (
		<div>
			<div className="flex flex-col gap-4">
				{/* GitHub connection section */}
				<GitHubConnectButton />

				{/* Download button */}
				<form action={downloadRepo} className="w-full">
					<Button
						type="submit"
						variant="outline"
						size="lg"
						className={cn("w-full")}
					>
						<DownloadIcon className="mr-2 h-4 w-4" />
						Download {siteConfig.name}
					</Button>
				</form>

				{hasGitHubConnection && (
					<>
						{/* Installation instructions */}
						<div className="space-y-4">
							<div className="prose dark:prose-invert">
								<h3>Quick Install</h3>
								<span className="block">
									Clone the repository with{" "}
									<CodeWindow
										code={`git clone ${siteConfig.repo.url}`}
										language="bash"
										variant="single"
										showLineNumbers={false}
									/>
									then install dependencies with{" "}
									<CodeWindow
										code="pnpm install"
										language="bash"
										variant="single"
										showLineNumbers={false}
									/>
								</span>
							</div>

							<div className="rounded-lg border bg-card p-4">
								<h3 className="mb-3 text-lg font-semibold">
									Full Installation Steps
								</h3>
								<CodeWindow
									title="Terminal"
									code={installationCode}
									language="bash"
									showLineNumbers={false}
									theme="dark"
									variant="minimal"
								/>
							</div>

							<div className="rounded-lg border bg-card p-4">
								<h3 className="mb-3 text-lg font-semibold">Using Docker</h3>
								<CodeWindow
									title="Terminal"
									code={dockerCode}
									language="bash"
									showLineNumbers={false}
									theme="dark"
									variant="minimal"
								/>
							</div>
						</div>
					</>
				)}

				{!hasGitHubConnection && (
					<div className="text-sm text-muted-foreground">
						<p>Connect GitHub to:</p>
						<ul className="mt-2 list-inside list-disc">
							<li>Access the repository directly</li>
							<li>Get automatic updates</li>
							<li>Access GitHub support</li>
						</ul>
					</div>
				)}
			</div>

			<p className="mt-4 text-sm text-muted-foreground">
				Need help? Check out our{" "}
				<Link href={routes.docs} className="underline">
					documentation
				</Link>{" "}
				or{" "}
				<Link href={routes.contact} className="underline">
					contact support
				</Link>
				.
			</p>
		</div>
	);
}

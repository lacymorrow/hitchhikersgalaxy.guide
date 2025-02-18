import { AuthForm } from "@/app/(app)/(authentication)/_components/login-form";
import { SignInForm } from "@/app/(app)/(authentication)/sign-in/_components/sign-in-form";
import { ConfettiSideCannons } from "@/components/magicui/confetti/confetti-side-cannons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SparklesCore } from "@/components/ui/sparkles";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { downloadRepoAnonymously } from "@/server/actions/github/download-repo";
import { auth } from "@/server/auth";
import { PaymentService } from "@/server/services/payment-service";
import { DownloadIcon } from "lucide-react";
import { Link } from "@/components/primitives/link-with-transition";

interface SearchParams {
	order_id?: string;
	order_number?: string;
	order_key?: string;
	product_id?: string;
	variant_id?: string;
	customer_id?: string;
	test_mode?: string;
	status?: string;
	email?: string;
	name?: string;
	custom_data?: string;
	[key: string]: string | undefined;
}

interface CustomData {
	user_id?: string;
	user_email?: string;
	[key: string]: unknown;
}

interface PageProps {
	searchParams: Promise<SearchParams>;
}

export default async function CheckoutSuccessPage({ searchParams: searchParamsPromise }: PageProps) {
	const searchParams = await searchParamsPromise;
	const session = await auth();
	const requestId = crypto.randomUUID();
	let customData: CustomData = {};
	let accessGranted = false;
	let canDownload = false;

	logger.info("Checkout success page loaded", {
		requestId,
		userId: session?.user?.id,
		userEmail: session?.user?.email,
		timestamp: new Date().toISOString(),
		searchParams,
	});

	try {
		// Process payment data...
		if (searchParams.custom_data) {
			try {
				customData = JSON.parse(searchParams.custom_data) as CustomData;
				logger.info("Parsed custom data", {
					requestId,
					customData,
				});
			} catch (error) {
				logger.error("Error parsing custom data", {
					requestId,
					error: error instanceof Error ? error.message : String(error),
					rawCustomData: searchParams.custom_data,
				});
			}
		}

		// Check if download is possible
		if (searchParams.order_id && searchParams.email && searchParams.status === "paid") {
			canDownload = true;
			logger.info("Download enabled", {
				requestId,
				orderId: searchParams.order_id,
				email: searchParams.email,
			});
		}

		// Grant access if possible...
		if (searchParams.order_id && (session?.user?.id || customData.user_id)) {
			try {
				await PaymentService.createPayment({
					userId: session?.user?.id || customData.user_id as string,
					orderId: searchParams.order_id,
					status: searchParams.status || "completed",
					amount: 0,
					metadata: JSON.stringify({
						searchParams,
						customData,
						test_mode: searchParams.test_mode === "true",
					}) as unknown as Record<string, unknown>,
				});

				accessGranted = true;
				logger.info("Access granted successfully", {
					requestId,
					orderId: searchParams.order_id,
					userId: session?.user?.id || customData.user_id,
				});
			} catch (error) {
				logger.error("Error granting access", {
					requestId,
					error: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : undefined,
				});
			}
		}
	} catch (error) {
		logger.error("Error processing checkout success", {
			requestId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			searchParams,
		});
	}

	return (
		<>
			<ConfettiSideCannons />
			<div className="relative min-h-screen w-full bg-background">
				{/* Sparkles background */}
				<div className="absolute inset-0 h-full w-full">
					<SparklesCore
						id="tsparticles"
						background="transparent"
						minSize={0.6}
						maxSize={1.4}
						particleDensity={40}
						className="h-full w-full"
						particleColor="#00C9A7"
					/>
				</div>

				{/* Content */}
				<div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-20">
					<h1 className="mb-8 text-center text-xl font-bold">
						Success
					</h1>
					<div className="mb-8 text-center">
						<h2 className="mb-2 text-4xl font-semibold">
							Welcome aboard
						</h2>
						<p className="text-muted-foreground">
							Your purchase was successful, we can't wait to see what you build.
						</p>
						{accessGranted && (
							<p className="mt-2 text-sm text-green-500">
								✓ Access granted successfully
							</p>
						)}
					</div>

					{session ? (
						// Logged in state
						<Card className="mb-8 w-full max-w-md p-6 text-center">
							<p className="mb-4">
								Your account is ready to go! Head to the dashboard to get started.
							</p>
							<Button asChild size="lg" className="w-full">
								<Link href={routes.app.dashboard}>
									Go to Dashboard
								</Link>
							</Button>
						</Card>
					) : (
						<AuthForm mode="sign-in" title="Sign in to get started" description="Get repository access and deploy your site in minutes">
							<SignInForm />
						</AuthForm>
					)}

					{canDownload && (
						<div className="mt-20 text-center">
							<h3 className="mb-4 text-lg font-semibold">
								Just want the code?
							</h3>
							{/* Download button */}
							<form action={downloadRepoAnonymously} className="w-full">
								<input type="hidden" name="email" value={searchParams.email} />
								<input type="hidden" name="orderId" value={searchParams.order_id} />
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
						</div>
					)}

					{/* Additional resources */}
					<div className="mt-20 text-center">
						<h3 className="mb-4 text-lg font-semibold">
							Need Help Getting Started?
						</h3>
						<div className="flex flex-wrap justify-center gap-4">
							<Button variant="outline" asChild>
								<Link href={routes.docs}>
									View Documentation
								</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link href={routes.contact}>
									Contact Support
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

"use client";

import { NetworkLog } from "@/app/(app)/(demo)/network/network-log";
import { ConsoleComponent } from "@/components/blocks/console-component";
import AnimatedButton from "@/components/buttons/animated-button/animated-button";
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from "@/components/primitives/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { createTestApiKey } from "@/server/actions/api-key-actions";
import { AnimatePresence, motion } from "framer-motion";
import type { User } from "next-auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export function LandingPageComponent({ user }: { user?: User }) {
	const [scrollY, setScrollY] = useState(0);
	const [testApiKey, setTestApiKey] = useState<string | null>(null);

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleCreateTestApiKey = async () => {
		try {
			const { key } = await createTestApiKey();

			if (!key) {
				throw new Error("Failed to create test API key");
			}

			setTestApiKey(key);
			return key;
		} catch (error) {
			console.error("Error creating test API key:", error);
			throw error;
		}
	};

	return (
		<div className="">
			<header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between p-4 backdrop-blur-sm">
				<div className="flex items-center space-x-2">
					<motion.div
						className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#818cf8] to-[#ec4899]"
						animate={{ rotate: scrollY / 10 }}
					/>
					<span className="text-xl font-bold">{siteConfig.name}</span>
				</div>
				<div className="flex space-x-2">
					<Link
						href={routes.external.github}
						target="_blank"
						className={cn(
							buttonVariants({ variant: "link" }),
							"duration-400 text-white/70 transition-all hover:text-white",
						)}
					>
						GitHub
					</Link>
					{user ? (
						<AnimatedButton href={routes.app.dashboard}>
							Dashboard
						</AnimatedButton>
					) : (
						<AnimatedButton href={routes.auth.signUp}>Sign up</AnimatedButton>
					)}
				</div>
			</header>

			<main className="pt-20">
				<section className="relative flex min-h-[60vh] items-center justify-center p-lg text-center md:flex-row">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						<PageHeader className="text-white">
							<PageHeaderHeading className="text-4xl md:text-6xl">
								See user logs in real-time.
							</PageHeaderHeading>
							<PageHeaderDescription className="text-xl text-gray-300 md:text-2xl">
								Get live, client-side logs for your JavaScript, React, Next.js,
								or any other application.
							</PageHeaderDescription>
						</PageHeader>

						<div className="flex justify-center space-x-4">
							<div className="relative h-12">
								<AnimatePresence mode="wait">
									{!testApiKey ? (
										<motion.div
											key="button"
											initial={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
											transition={{ duration: 0.3 }}
										>
											<div className="flex space-x-4">
												<Button
													variant="outline"
													onClick={() => void handleCreateTestApiKey()}
												>
													Create Live Key
												</Button>
												<Link
													className={buttonVariants()}
													href={
														user ? routes.app.dashboard : routes.auth.signIn
													}
												>
													Dashboard
												</Link>
											</div>
										</motion.div>
									) : (
										<motion.div
											key="apiKey"
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.3, delay: 0.2 }}
										>
											<>
												<div className="rounded-lg p-3  backdrop-blur-sm">
													<p className="text-sm">Your Test API Key:</p>
													<p className="font-mono text-lg">{testApiKey}</p>
												</div>

												<h2 className="text-lg font-bold">
													To see it in action, copy your API key and paste it
													into your application.
												</h2>
												<code className="text-left text-muted-foreground">
													<pre>{`curl -X POST \\
  -H "Authorization: Bearer ${testApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello from curl!", "level": "info"}' \\
  https://log.bones.sh/v1/`}</pre>
												</code>
											</>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>
					</motion.div>
				</section>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1 }}
				>
					<ConsoleComponent
						onCreateTestKey={handleCreateTestApiKey}
						apiKey={testApiKey}
					/>
				</motion.div>

				<section className="relative px-4 py-20 text-white max-w-screen-xl mx-auto">
					<NetworkLog />
				</section>
			</main>
		</div>
	);
}

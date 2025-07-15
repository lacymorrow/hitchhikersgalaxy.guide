"use client";

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useWindowScroll } from "@uidotdev/usehooks";
import { cva } from "class-variance-authority";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import type React from "react";
import { useMemo } from "react";
import { Icon } from "@/components/assets/icon";
import { LoginButton } from "@/components/buttons/sign-in-button";
import { Link } from "@/components/primitives/link-with-transition";
import { SearchAi } from "@/components/search/search-ai";
import { UserMenu } from "@/components/shipkit/user-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";
import styles from "@/styles/header.module.css";
import type { User } from "@/types/user";
import { BuyButton } from "../buttons/lemonsqueezy-buy-button";

interface NavLink {
	href: string;
	label: string;
	isCurrent?: boolean;
}

interface HeaderProps {
	navLinks?: NavLink[];
	logoHref?: string;
	logoIcon?: React.ReactNode;
	logoText?: string;
	searchPlaceholder?: string;
	variant?: "default" | "sticky" | "floating";
	user?: User | null;
	className?: string;
}

const defaultNavLinks = [
	{ href: routes.faq, label: "Faqs", isCurrent: false },
	{ href: routes.features, label: "Features", isCurrent: false },
	{ href: routes.pricing, label: "Pricing", isCurrent: false },
];

const headerVariants = cva("translate-z-0 z-50 p-md", {
	variants: {
		variant: {
			default: "relative",
			floating: "sticky top-0 h-24",
			sticky:
				"sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export const Header: React.FC<HeaderProps> = ({
	logoHref = routes.home,
	logoIcon = <Icon className="h-5 w-5" />,
	logoText = siteConfig.title,
	navLinks = defaultNavLinks,
	variant = "default",
	user,
	className,
}) => {
	const [{ y }] = useWindowScroll();
	const isOpaque = useMemo(() => variant === "floating" && y && y > 100, [y, variant]);
	const { data: session } = useSession();

	const isLoggedIn = !!session?.user || !!user;

	return (
		<>
			<header
				className={cn(
					headerVariants({ variant }),
					variant === "floating" && styles.header,
					variant === "floating" && isOpaque && styles.opaque,
					variant === "floating" &&
						isOpaque &&
						"-top-[12px] [--background:#fafafc70] dark:[--background:#1c1c2270]",
					className
				)}
			>
				{variant === "floating" && <div className="h-[12px] w-full" />}
				<nav className="container flex items-center justify-between gap-md">
					<div className="hidden flex-col gap-md md:flex md:flex-row md:items-center">
						<Link
							href={logoHref}
							className="flex grow items-center gap-2 text-lg font-semibold md:mr-6 md:text-base"
						>
							{logoIcon}
							<span className="block">{logoText}</span>
							<span className="sr-only">{logoText}</span>
						</Link>
						<div className="hidden items-center justify-between gap-md text-sm md:flex">
							{isLoggedIn && (
								<Link
									key={routes.docs}
									href={routes.docs}
									className={cn("transition-colors text-muted-foreground hover:text-foreground")}
								>
									Documentation
								</Link>
							)}
							{navLinks.map((link) => (
								<Link
									key={`${link.href}-${link.label}`}
									href={link.href}
									className={cn(
										"transition-colors hover:text-foreground",
										link.isCurrent ? "text-foreground" : "text-muted-foreground"
									)}
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>

					<Sheet>
						<SheetTrigger asChild>
							<Button variant="outline" size="icon" className="shrink-0 md:hidden">
								<HamburgerMenuIcon className="h-5 w-5" />
								<span className="sr-only">Toggle navigation menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left">
							<nav className="grid gap-6 font-medium">
								<Link href={logoHref} className="flex items-center gap-2 text-lg font-semibold">
									{logoIcon}
									<span className="sr-only">{logoText}</span>
								</Link>
								{navLinks.map((link) => (
									<Link
										key={`${link.href}-${link.label}`}
										href={link.href}
										className={cn(
											"text-muted-foreground hover:text-foreground",
											link.isCurrent ? "text-foreground" : ""
										)}
									>
										{link.label}
									</Link>
								))}
								{!isLoggedIn && (
									<>
										<Link
											href={routes.auth.signIn}
											className={cn(
												buttonVariants({ variant: "default" }),
												"w-full justify-center"
											)}
										>
											Get Shipkit
										</Link>
										<LoginButton
											className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-center")}
										/>
									</>
								)}
								{isLoggedIn && (
									<>
										<Link
											href={routes.docs}
											className={cn("text-muted-foreground hover:text-foreground")}
										>
											Documentation
										</Link>
										<Link
											href={routes.app.dashboard}
											className={cn(
												buttonVariants({ variant: "default" }),
												"w-full justify-center"
											)}
										>
											Dashboard
										</Link>
									</>
								)}
							</nav>
						</SheetContent>
					</Sheet>
					<div className="flex items-center gap-2 md:ml-auto lg:gap-4">
						<SearchAi className="hidden md:block" />

						<div className="flex items-center gap-2">
							{/* If they are not signed in, we need to show the theme toggle. */}
							{!isLoggedIn && (
								<ThemeToggle variant="ghost" size="icon" className="hidden md:flex rounded-full" />
							)}

							<UserMenu user={user} />

							<div className="flex items-center gap-2">
								{!session && (
									<AnimatePresence mode="wait">
										{y && y > 700 ? (
											<motion.div
												key="compact"
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.9 }}
												transition={{ duration: 0.1 }}
											>
												<TooltipProvider delayDuration={0}>
													<Tooltip>
														<TooltipTrigger asChild>
															<div className="relative -m-4 p-4">
																<BuyButton />
															</div>
														</TooltipTrigger>
														<TooltipContent
															side="bottom"
															sideOffset={3}
															className="-mt-3 select-none border-none bg-transparent p-0 text-xs text-muted-foreground shadow-none data-[state=delayed-open]:animate-fadeDown"
														>
															<LoginButton className="hover:text-foreground">or Login</LoginButton>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</motion.div>
										) : (
											<motion.div
												key="full"
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.9 }}
												transition={{ duration: 0.1 }}
											>
												<LoginButton variant="outline" nextUrl={routes.app.dashboard}>
													Dashboard
												</LoginButton>
											</motion.div>
										)}
									</AnimatePresence>
								)}
							</div>
						</div>
					</div>
				</nav>
			</header>
			{variant === "floating" && <div className="-mt-24" />}
		</>
	);
};

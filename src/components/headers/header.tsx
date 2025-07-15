"use client";

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { cva } from "class-variance-authority";
import { useSession } from "next-auth/react";
import type React from "react";
import { Icon } from "@/components/assets/icon";
import { Link } from "@/components/primitives/link-with-transition";
import { SearchMenu } from "@/components/search/search-menu";
import { UserMenu } from "@/components/shipkit/user-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme";
import type { NavLink } from "@/config/navigation";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { useSignInRedirectUrl } from "@/hooks/use-auth-redirect";
import { cn } from "@/lib/utils";
import styles from "@/styles/header.module.css";
import { BuyButton } from "../buttons/lemonsqueezy-buy-button";

interface HeaderProps {
	navLinks?: NavLink[];
	logoHref?: string;
	logoIcon?: React.ReactNode;
	logoText?: string;
	searchPlaceholder?: string;
	variant?: "default" | "sticky" | "floating" | "logo-only";
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
			"logo-only": "relative",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export const Header: React.FC<HeaderProps> = ({
	logoHref = routes.home,
	logoIcon = <Icon />,
	logoText = siteConfig.title,
	navLinks = defaultNavLinks,
	variant = "default",
	searchPlaceholder = `Search ${siteConfig.title}...`,
	className,
}) => {
	const signInRedirectUrl = useSignInRedirectUrl();
	const { data: session } = useSession();

	const isLogoOnly = variant === "logo-only";

	return (
		<>
			<header
				className={cn(
					headerVariants({ variant }),
					variant === "floating" && styles.header,
					"-top-[12px] [--background:#fafafc70] dark:[--background:#1c1c2270]",
					className
				)}
			>
				{variant === "floating" && <div className="h-[12px] w-full" />}
				<nav
					className={cn(
						"container flex items-center gap-md",
						isLogoOnly ? "justify-center" : "justify-between"
					)}
				>
					<div
						className={cn(
							"flex-col gap-md md:flex md:flex-row md:items-center",
							isLogoOnly ? "flex" : "hidden"
						)}
					>
						<Link
							href={logoHref}
							className="flex grow items-center gap-2 text-lg font-semibold md:mr-6 md:text-base"
						>
							{logoIcon}
							<span className="block whitespace-nowrap">{logoText}</span>
						</Link>
						{!isLogoOnly && (
							<SearchMenu
								buttonText={
									<>
										<span className="hidden md:block">{searchPlaceholder}</span>
										<span className="block md:hidden">Search</span>
									</>
								}
								minimal={true}
								buttonClassName="w-full md:w-auto"
							/>
						)}
					</div>

					{!isLogoOnly && (
						<>
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
										{!session && (
											<>
												<Link
													href={routes.launch}
													className={cn(
														buttonVariants({ variant: "default" }),
														"w-full justify-center"
													)}
												>
													Get Shipkit
												</Link>
												<Link
													href={signInRedirectUrl}
													className={cn(
														buttonVariants({ variant: "ghost" }),
														"w-full justify-center"
													)}
												>
													Login
												</Link>
											</>
										)}
										{session && (
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
								<div className="hidden items-center justify-between gap-md text-sm md:flex">
									{session && (
										<Link
											key={routes.docs}
											href={routes.docs}
											className={cn(
												"text-muted-foreground transition-colors hover:text-foreground"
											)}
										>
											Documentation
										</Link>
									)}
									{navLinks.map((link) => {
										return (
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
										);
									})}
								</div>
								<div className="flex items-center gap-2">
									{!session && <ThemeToggle variant="ghost" size="icon" className="rounded-full" />}

									<UserMenu />

									{!session && <BuyButton />}
								</div>
							</div>
						</>
					)}
				</nav>
			</header>
			{variant === "floating" && <div className="-mt-24" />}
		</>
	);
};

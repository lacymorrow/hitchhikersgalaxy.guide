"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import * as React from "react";
import { ShortcutDisplay } from "@/components/primitives/shortcut-display";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ShortcutAction, type ShortcutActionType } from "@/config/keyboard-shortcuts";
import { routes } from "@/config/routes";
import { useSignInRedirectUrl } from "@/hooks/use-auth-redirect";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateTheme } from "@/server/actions/settings";

type Theme = "light" | "dark" | "system";

interface UserMenuProps {
	size?: "default" | "sm";
	className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ size = "default", className }) => {
	const { data: session, status } = useSession();
	const signInRedirectUrl = useSignInRedirectUrl();
	const { theme, setTheme } = useTheme();
	const { toast } = useToast();
	const [isOpen, setIsOpen] = React.useState(false);
	const router = useRouter();

	const isAdmin = useIsAdmin();

	const handleThemeChange = React.useCallback(
		async (value: string) => {
			const newTheme = value as Theme;
			// Update the theme immediately for a snappy UI
			setTheme(newTheme);

			// Then persist to the database
			if (session?.user) {
				try {
					const result = await updateTheme(newTheme);
					if (!result.success) {
						toast({
							title: "Failed to save theme preference",
							description: result.error || "Your theme preference will reset on next visit.",
							variant: "destructive",
						});
						return;
					}
					toast({
						title: "Theme updated",
						description: result.message,
					});
				} catch (error) {
					console.error("Failed to update theme:", error);
					toast({
						title: "Failed to save theme preference",
						description: "Your theme preference will reset on next visit.",
						variant: "destructive",
					});
				}
			}
		},
		[session?.user, setTheme, toast]
	);

	const handleShortcut = React.useCallback(
		(event: KeyboardEvent, action: ShortcutActionType) => {
			event.preventDefault();
			switch (action) {
				case ShortcutAction.SET_THEME_LIGHT:
					void handleThemeChange("light");
					break;
				case ShortcutAction.SET_THEME_DARK:
					void handleThemeChange("dark");
					break;
				case ShortcutAction.SET_THEME_SYSTEM:
					void handleThemeChange("system");
					break;
				case ShortcutAction.GOTO_ADMIN:
					if (isAdmin) router.push(routes.admin.index);
					break;
				case ShortcutAction.GOTO_SETTINGS:
					router.push(routes.settings.index);
					break;
				case ShortcutAction.LOGOUT_USER:
					void signOut({ callbackUrl: routes.home });
					break;
			}
		},
		[handleThemeChange, isAdmin, router]
	);

	const isAuthenticated = status === "authenticated";

	useKeyboardShortcut(
		ShortcutAction.SET_THEME_LIGHT,
		(event) => handleShortcut(event, ShortcutAction.SET_THEME_LIGHT),
		undefined,
		[handleShortcut]
	);
	useKeyboardShortcut(
		ShortcutAction.SET_THEME_DARK,
		(event) => handleShortcut(event, ShortcutAction.SET_THEME_DARK),
		undefined,
		[handleShortcut]
	);
	useKeyboardShortcut(
		ShortcutAction.SET_THEME_SYSTEM,
		(event) => handleShortcut(event, ShortcutAction.SET_THEME_SYSTEM),
		undefined,
		[handleShortcut]
	);
	useKeyboardShortcut(
		ShortcutAction.GOTO_ADMIN,
		(event) => handleShortcut(event, ShortcutAction.GOTO_ADMIN),
		() => isAuthenticated && isAdmin,
		[handleShortcut, isAuthenticated, isAdmin]
	);
	useKeyboardShortcut(
		ShortcutAction.GOTO_SETTINGS,
		(event) => handleShortcut(event, ShortcutAction.GOTO_SETTINGS),
		() => isAuthenticated,
		[handleShortcut, isAuthenticated]
	);
	useKeyboardShortcut(
		ShortcutAction.LOGOUT_USER,
		(event) => handleShortcut(event, ShortcutAction.LOGOUT_USER),
		() => isAuthenticated,
		[handleShortcut, isAuthenticated]
	);

	// Loading state
	if (status === "loading") {
		return (
			<Skeleton className={cn("rounded-full", size === "sm" ? "h-6 w-6" : "h-8 w-8")}>
				<div className={cn("rounded-full bg-muted", size === "sm" ? "h-6 w-6" : "h-8 w-8")} />
			</Skeleton>
		);
	}

	// Not authenticated
	if (!session?.user) {
		return (
			<Link
				href={signInRedirectUrl}
				className={cn(
					buttonVariants({ variant: "ghost", size: "icon" }),
					"rounded-full cursor-pointer"
				)}
			>
				<UserIcon className="size-4" />
			</Link>
		);
	}

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn("relative rounded-full", size === "sm" ? "h-6 w-6" : "h-8 w-8", className)}
					aria-label="User menu"
				>
					<Avatar className={cn(size === "sm" ? "h-6 w-6" : "h-8 w-8")}>
						<AvatarImage
							src={session?.user?.image || ""}
							alt={session?.user?.name || "User avatar"}
						/>
						<AvatarFallback>{session?.user?.name?.[0]?.toUpperCase() || "?"}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56"
				align="end"
				forceMount
				onCloseAutoFocus={(event) => {
					event.preventDefault();
				}}
			>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{session?.user?.name}</p>
						<p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{isAdmin && (
						<DropdownMenuItem asChild>
							<Link href={routes.admin.index}>
								Admin
								<ShortcutDisplay action={ShortcutAction.GOTO_ADMIN} as={DropdownMenuShortcut} />
							</Link>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem asChild>
						<Link href={routes.settings.index}>
							Settings
							<ShortcutDisplay action={ShortcutAction.GOTO_SETTINGS} as={DropdownMenuShortcut} />
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<SunIcon className="mr-2 size-4" />
						<span>Theme</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
							<DropdownMenuRadioItem value="light">
								<SunIcon className="mr-2 size-4" />
								Light
								<ShortcutDisplay
									action={ShortcutAction.SET_THEME_LIGHT}
									as={DropdownMenuShortcut}
								/>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="dark">
								<MoonIcon className="mr-2 size-4" />
								Dark
								<ShortcutDisplay action={ShortcutAction.SET_THEME_DARK} as={DropdownMenuShortcut} />
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="system">
								<DesktopIcon className="mr-2 size-4" />
								System
								<ShortcutDisplay
									action={ShortcutAction.SET_THEME_SYSTEM}
									as={DropdownMenuShortcut}
								/>
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => void signOut({ callbackUrl: routes.home })}>
					Sign out
					<ShortcutDisplay action={ShortcutAction.LOGOUT_USER} as={DropdownMenuShortcut} />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

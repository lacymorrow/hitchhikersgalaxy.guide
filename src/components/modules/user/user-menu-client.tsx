"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import * as React from "react";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
import { UserMenuDropdown } from "@/components/modules/user/user-menu-dropdown";
import { ShortcutAction, type ShortcutActionType } from "@/config/keyboard-shortcuts";
import { routes } from "@/config/routes";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useSubscription } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import { updateTheme } from "@/server/actions/settings";
import type { User } from "@/types/user";

type Theme = "light" | "dark" | "system";

interface UserMenuClientProps {
    size?: "default" | "sm";
    className?: string;
    showUpgrade?: boolean;
    user?: User | null;
}

export const UserMenuClient: React.FC<UserMenuClientProps> = ({
    size = "default",
    className,
    showUpgrade = false,
    user,
}) => {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const { theme, setTheme } = useTheme();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = React.useState(false);
    const { hasActiveSubscription } = useSubscription();
    const router = useRouter();
    const isAdmin = useIsAdmin();

    const currentUser = user ?? session?.user;
    const isAuthenticated = status === "authenticated";
    const isOnAuthPage = pathname === routes.auth.signIn || pathname === routes.auth.signUp;

    const handleThemeChange = React.useCallback(
        async (value: string) => {
            const newTheme = value as Theme;
            setTheme(newTheme);
            if (currentUser) {
                try {
                    const result = await updateTheme(newTheme);
                    if (!result.success) {
                        toast({
                            title: "Failed to save theme preference",
                            description: result.error ?? "Your theme preference will reset on next visit.",
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
        [currentUser, setTheme, toast]
    );

    // ---- Refactored Shortcut Handling ----
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

    // Don't render anything if no user or still loading
    if (!currentUser || status === "loading") {
        return null;
    }

    return (
        <UserMenuDropdown
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            user={currentUser}
            isAdmin={isAdmin}
            showUpgrade={showUpgrade}
            hasActiveSubscription={hasActiveSubscription}
            theme={theme ?? "system"}
            handleThemeChange={handleThemeChange}
        >
            <div />
        </UserMenuDropdown>
    );
};

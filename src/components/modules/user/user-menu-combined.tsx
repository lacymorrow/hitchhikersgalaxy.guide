import { UserMenuClient } from "./user-menu-client";
import { UserMenuServer } from "./user-menu-server";

interface UserMenuCombinedProps {
    size?: "default" | "sm";
    className?: string;
    showUpgrade?: boolean;
    /** Whether we're currently on an auth page (sign-in or sign-up) */
    isOnAuthPage?: boolean;
}

export const UserMenuCombined = async ({
    size = "default",
    className,
    showUpgrade = false,
    isOnAuthPage = false,
}: UserMenuCombinedProps) => {
    return (
        <div className="relative">
            {/* Server-rendered content for initial state */}
            <UserMenuServer
                size={size}
                className={className}
                showUpgrade={showUpgrade}
                isOnAuthPage={isOnAuthPage}
            />

            {/* Client-side interactivity layer */}
            <div className="absolute inset-0">
                <UserMenuClient
                    size={size}
                    className={className}
                    showUpgrade={showUpgrade}
                />
            </div>
        </div>
    );
};

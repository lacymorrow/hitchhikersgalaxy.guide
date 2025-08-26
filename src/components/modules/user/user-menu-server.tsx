import { UserIcon } from "lucide-react";
import type { Session } from "next-auth";
import { Link } from "@/components/primitives/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

interface UserMenuServerProps {
    size?: "default" | "sm";
    className?: string;
    showUpgrade?: boolean;
    /** Whether we're currently on an auth page (sign-in or sign-up) */
    isOnAuthPage?: boolean;
}

export const UserMenuServer = async ({
    size = "default",
    className,
    showUpgrade = false,
    isOnAuthPage = false,
}: UserMenuServerProps) => {
    const session = (await auth()) as Session | null;
    const currentUser = session?.user as User | null;

    return (
        <div
            className={cn(
                "relative rounded-full flex items-center justify-center aspect-square",
                size === "sm" ? "size-9" : "size-9"
            )}
        >
            {currentUser ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("relative rounded-full", size === "sm" ? "size-6" : "size-8", className)}
                    aria-label="User menu"
                >
                    <Avatar className={cn(size === "sm" ? "size-6" : "size-8")}>
                        <AvatarImage
                            src={currentUser.image ?? ""}
                            alt={currentUser.name ?? "User avatar"}
                            draggable={false}
                        />
                        <AvatarFallback>{currentUser.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                    </Avatar>
                </Button>
            ) : (
                !isOnAuthPage ? (
                    <Link
                        href={routes.auth.signIn}
                        className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "rounded-full cursor-pointer"
                        )}
                    >
                        <UserIcon className="size-6" />
                    </Link>
                ) : (
                    <Button variant="ghost" size="icon" className={cn("relative rounded-full", className)}>
                        <UserIcon className="size-6" />
                    </Button>
                )
            )}
        </div>
    );
};

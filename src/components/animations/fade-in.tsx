"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface FadeInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // Delay in milliseconds
    duration?: number; // Duration in milliseconds
}

export const FadeIn = ({
    children,
    className,
    delay = 0,
    duration = 300,
}: FadeInProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={cn(
                "transition-opacity w-full h-full",
                isVisible ? "opacity-100" : "opacity-0",
                className
            )}
            style={{ transitionDuration: `${duration}ms` }}
        >
            {children}
        </div>
    );
};

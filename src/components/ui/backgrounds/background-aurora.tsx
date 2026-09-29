"use client";
import type React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BackgroundAuroraProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

/**
 * BackgroundAurora component provides a visually appealing background
 * with an optional radial gradient effect. It utilizes CSS variables
 * for theming and responsiveness.
 */
export const BackgroundAurora = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: BackgroundAuroraProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex h-screen flex-col items-center justify-center bg-zinc-50 text-slate-950 transition-bg dark:bg-zinc-900",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            //   I'm sorry but this is what peak developer performance looks like // trigger warning
            className={cn(
              `pointer-events-none absolute inset-[-10px] opacity-50 blur-[10px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--color-blue-500)_10%,var(--color-indigo-300)_15%,var(--color-blue-300)_20%,var(--color-violet-200)_25%,var(--color-blue-400)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--color-black)_0%,var(--color-black)_7%,transparent_10%,transparent_12%,var(--color-black)_16%)] [--white-gradient:repeating-linear-gradient(100deg,var(--color-white)_0%,var(--color-white)_7%,transparent_10%,transparent_12%,var(--color-white)_16%)] [background-image:var(--white-gradient),var(--aurora)] bg-position-[50%_50%,50%_50%] bg-size-[300%,200%] after:absolute after:inset-0 after:animate-aurora after:mix-blend-difference after:content-[""] after:bg-fixed after:[background-image:var(--white-gradient),var(--aurora)] after:bg-size-[200%,100%] dark:invert-0 dark:[background-image:var(--dark-gradient),var(--aurora)] dark:after:[background-image:var(--dark-gradient),var(--aurora)]`,
              showRadialGradient &&
                "mask-[radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]"
            )}
          />
        </div>
        {children}
      </div>
    </main>
  );
};

"use client";

import { useTheme } from "next-themes";

import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";

export function ParticlesHero({
  children,
  className,
  quantity = 12,
  speed = 80,
  color,
}: {
  children: React.ReactNode;
  className?: string;
  quantity?: number;
  speed?: number;
  color?: string;
}) {
  const { resolvedTheme } = useTheme();
  const currentColor = color ?? (resolvedTheme === "dark" ? "#ffffff" : "#000000");

  return (
    <div className={cn("relative w-full bg-background", className)}>
      {children}
      <Particles
        className="absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom_right,white,transparent)]"
        quantity={quantity}
        ease={speed}
        color={currentColor}
        refresh
      />
    </div>
  );
}

"use client";

import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A toolbar that floats on a translucent material and only draws its bottom
 * hairline once content has scrolled beneath it (the HIG "scroll edge effect").
 * At rest the header and the page read as one surface.
 */
export const ScrollEdgeHeader = ({ className, children, ...props }: ComponentProps<"header">) => {
  const [edge, setEdge] = useState(false);

  useEffect(() => {
    const update = () => setEdge(window.scrollY > 2);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-edge={edge}
      className={cn(
        "bg-background/70 backdrop-blur-xl backdrop-saturate-150 supports-backdrop-filter:bg-background/70",
        "transition-shadow duration-200 ease-out-quart data-[edge=true]:shadow-hairline-b",
        className
      )}
      {...props}
    >
      {children}
    </header>
  );
};

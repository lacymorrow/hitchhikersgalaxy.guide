"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { STATUS_CODES } from "@/config/status-codes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";

interface ConnectionHighlightWrapperProps {
  children: React.ReactNode;
  connectionType: "github" | "vercel" | "cell";
}

export const ConnectionHighlightWrapper = ({
  children,
  connectionType,
}: ConnectionHighlightWrapperProps) => {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read directly from window.location to avoid useSearchParams() Suspense timing issues
    const params = new URLSearchParams(window.location.search);
    const code = params.get(SEARCH_PARAM_KEYS.statusCode);

    const slug =
      `CONNECT_${connectionType.toUpperCase()}` as keyof typeof STATUS_CODES;
    const shouldHighlight =
      code?.toLowerCase() === STATUS_CODES[slug]?.code.toLowerCase();

    if (shouldHighlight && wrapperRef.current) {
      // Scroll into view
      wrapperRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Add highlight animation
      wrapperRef.current.classList.add("animate-connection-highlight");

      // Remove animation class after animation completes
      const timeout = setTimeout(() => {
        wrapperRef.current?.classList.remove("animate-connection-highlight");

        // Clean up URL after animation
        const url = new URL(window.location.href);
        url.searchParams.delete(SEARCH_PARAM_KEYS.statusCode);

        if (code) {
          router.replace(url.pathname + (url.search ? url.search : ""), {
            scroll: false,
          });
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [connectionType, router]);

  return (
    <div ref={wrapperRef} className="rounded-lg">
      {children}
    </div>
  );
};

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { STATUS_CODES } from "@/config/status-codes";
import { cn } from "@/lib/utils";

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
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get(SEARCH_PARAM_KEYS.statusCode);

    const slug = `CONNECT_${connectionType.toUpperCase()}` as keyof typeof STATUS_CODES;
    const expectedCode = STATUS_CODES[slug]?.code;
    const shouldHighlight = code?.toLowerCase() === expectedCode?.toLowerCase();

    if (shouldHighlight && wrapperRef.current) {
      // Scroll into view
      wrapperRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Trigger highlight via state so React controls the style
      setHighlighted(true);

      // Remove highlight and clean up URL after animation
      const timeout = setTimeout(() => {
        setHighlighted(false);

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
    <div
      ref={wrapperRef}
      className={cn(
        "rounded-lg transition-all duration-700",
        highlighted &&
          "ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5),0_0_40px_rgba(59,130,246,0.25)]"
      )}
    >
      {children}
    </div>
  );
};

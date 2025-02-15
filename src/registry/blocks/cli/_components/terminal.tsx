"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Convert from "ansi-to-html";
import { useEffect, useMemo, useRef } from "react";

interface TerminalProps {
  output: string[];
  className?: string;
}

// Clean up control sequences that ansi-to-html doesn't handle
function cleanAnsi(text: string): string {
  return (
    text
      // Remove cursor hide/show
      .replace(/\u001b\[\?25[hl]/g, "")
      // Remove clear line and move cursor sequences
      .replace(/\u001b\[2K/g, "")
      .replace(/\u001b\[1G/g, "")
      // Remove other control sequences as needed
      .replace(/\u001b\[\d*[ABCDEFGJKST]/g, "")
  );
}

export function Terminal({ output, className }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const convert = useMemo(
    () =>
      new Convert({
        fg: "#D4D4D4",
        bg: "#1E1E1E",
        newline: false,
        escapeXML: true,
        stream: true,
      }),
    []
  );

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (scrollRef.current && scrollAreaRef.current) {
      const scrollElement = scrollRef.current;
      const viewportElement = scrollAreaRef.current;

      // Check if scroll is near bottom before auto-scrolling
      const isNearBottom =
        viewportElement.scrollHeight -
          viewportElement.scrollTop -
          viewportElement.clientHeight <
        50;

      if (isNearBottom) {
        scrollElement.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [output]);

  // Process the output to handle newlines properly
  const processedOutput = useMemo(() => {
    return output.join("\n").split(/\r?\n/);
  }, [output]);

  return (
    <ScrollArea className={cn("bg-[#1E1E1E]", className)} ref={scrollAreaRef}>
      <div className="p-4 font-mono text-sm text-[#D4D4D4] leading-5">
        {processedOutput.map((line, i) => (
          <div
            key={i}
            className="min-h-[6px]"
            dangerouslySetInnerHTML={{
              __html: convert.toHtml(cleanAnsi(line)) || "&nbsp;",
            }}
          />
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}

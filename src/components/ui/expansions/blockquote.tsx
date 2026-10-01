import type React from "react";
import { cn } from "@/lib/utils";

type BlockquoteProps = {
  children?: React.ReactNode;
  className?: string;
};

const Blockquote = ({ children, className }: BlockquoteProps) => {
  return (
    <div
      className={cn(
        "relative rounded-lg border-l-8 border-l-gray-700 bg-gray-100 py-5 pr-5 pl-16 font-sans text-lg leading-relaxed text-gray-500 italic before:absolute before:top-3 before:left-3 before:font-serif before:text-6xl before:text-gray-700 before:content-['“']",
        className
      )}
    >
      {children}
    </div>
  );
};

const BlockquoteAuthor = ({ children, className }: BlockquoteProps) => {
  return (
    <p className={cn("mt-5 pr-4 text-right font-bold text-gray-700 not-italic", className)}>
      {children}
    </p>
  );
};

export { Blockquote, BlockquoteAuthor };

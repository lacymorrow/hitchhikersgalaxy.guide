import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom shadows from theme.css (--shadow-hairline*). Without this, twMerge keeps
// both `shadow-hairline` and a caller's `shadow-lg`, and the hairline wins on CSS order.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      shadow: ["hairline", "hairline-b", "hairline-t"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

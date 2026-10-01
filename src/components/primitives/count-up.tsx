"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** The final number. */
  value: number;
  /** Text before the number, such as "$". */
  prefix?: string;
  /** Text after the number, such as "%". */
  suffix?: string;
  /** Decimal places to show. Defaults to the places in `value`. */
  decimals?: number;
  /** Total time in ms. Under a second so it never makes anyone wait. */
  duration?: number;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Counts from 0 to `value` once, on first paint. Renders the final number on the server
 * and for anyone who prefers reduced motion, so the page is never wrong at rest.
 */
export const CountUp = ({
  value,
  prefix = "",
  suffix = "",
  decimals,
  duration = 900,
  className,
}: CountUpProps) => {
  const places = decimals ?? (value % 1 === 0 ? 0 : 2);
  const format = (n: number) =>
    `${prefix}${n.toLocaleString("en-US", {
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    })}${suffix}`;

  const [shown, setShown] = useState(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(value * easeOutCubic(progress));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  // Assistive tech reads the final figure; the ticking one is decoration.
  return (
    <span className={className}>
      <span className="sr-only">{format(value)}</span>
      <span aria-hidden>{format(shown)}</span>
    </span>
  );
};

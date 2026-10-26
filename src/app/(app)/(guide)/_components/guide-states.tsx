import { SatelliteDish } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The two states a guide listing can be in with no entries to show. They are
 * deliberately not the same state.
 *
 * `GuideUnavailable` says nothing is lost and offers no action, because while
 * the database is unreachable a search cannot work either. The copy it
 * replaces ("No entries yet. Start exploring to create some!") claimed the
 * guide was empty and invited exactly that dead action (LAC-5520). It also
 * gives no estimate: the outage that prompted this one runs until a quota
 * reset weeks away, so "try again in a few minutes" would be a lie.
 *
 * `GuideEmpty` does invite a search, because when the table really is empty a
 * search is the thing that fills it.
 *
 * Both inherit their colour from the caller, so they sit inside the blue
 * `/popular` frame and the teal `/browse` and home frames without a variant.
 * Pass a base colour with no alpha: they dim themselves, and the two stack.
 */
export const GuideUnavailable = ({
  className,
  /**
   * Drop the heading. The home page's hero already reads DON'T PANIC in
   * display type, and the marquee sits just below it, so repeating the line
   * there looks like a rendering fault rather than a considered state.
   */
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) => (
  <div className={cn("flex flex-col items-center justify-center gap-3 text-center", className)}>
    <SatelliteDish aria-hidden className="h-8 w-8 opacity-40" />
    {!compact && <p className="font-mono text-lg font-bold">Don't panic.</p>}
    <p className="max-w-[32rem] font-mono text-sm text-balance opacity-70">
      The Guide can't reach its records right now. The entries are all still there.
    </p>
  </div>
);

export const GuideEmpty = ({ className }: { className?: string }) => (
  <p className={cn("max-w-[32rem] text-center font-mono text-balance opacity-60", className)}>
    The Guide is still being written. Search for anything to add the first entry.
  </p>
);

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MatchResult } from "../_lib/resume-filters";

interface ResumeEntryCardProps {
  title: string;
  subtitle: string;
  dateRange: string;
  location?: string;
  summary: string;
  tags: string[];
  url?: string;
  highlights?: string[];
  match?: MatchResult;
}

function formatDateRange(startDate: string, endDate?: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };
  const start = fmt(startDate);
  const end = endDate ? fmt(endDate) : "Present";
  return start === end ? start : `${start} - ${end}`;
}

export { formatDateRange };

export function ResumeEntryCard({
  title,
  subtitle,
  dateRange,
  location,
  summary,
  tags,
  url,
  highlights,
  match,
}: ResumeEntryCardProps) {
  const isMatched = !match || match.matched;

  return (
    <div
      data-match={isMatched}
      className="group relative border-l-2 border-border py-4 pl-6 transition-all duration-300 data-[match=false]:opacity-25 data-[match=false]:grayscale-50"
    >
      <div className="absolute top-6 left-[-5px] h-2 w-2 rounded-full bg-primary transition-colors group-data-[match=false]:bg-muted" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="leading-tight font-semibold">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                {title}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              title
            )}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-muted-foreground">{dateRange}</p>
          {location && <p className="text-xs text-muted-foreground/70">{location}</p>}
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>

      {highlights && highlights.length > 0 && (
        <ul className="mt-2 space-y-1">
          {highlights.map((h) => (
            <li key={h} className="text-sm text-muted-foreground">
              • {h}
            </li>
          ))}
        </ul>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

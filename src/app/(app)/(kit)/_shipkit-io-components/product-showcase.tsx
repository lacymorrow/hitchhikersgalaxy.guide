import { cn } from "@/lib/utils";

const showcaseItems = [
  {
    title: "Dashboard Preview",
    description: "Admin dashboard with analytics, user management, and real-time data",
    gradient: "from-blue-500/20 to-indigo-500/20",
  },
  {
    title: "Auth Flow",
    description: "Multi-provider authentication with OAuth, magic link, and guest access",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "CMS Admin",
    description: "Payload CMS with content modeling, media management, and live preview",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    title: "AI Integration",
    description: "OpenAI and Anthropic APIs with streaming, RAG, and cost tracking",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
];

const BrowserChrome = ({
  title,
  description,
  gradient,
}: {
  title: string;
  description: string;
  gradient: string;
}) => (
  <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
    {/* Browser top bar */}
    <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2.5">
      <div className="flex gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
      </div>
      <div className="ml-2 flex-1 rounded-md bg-background/50 px-3 py-1 text-xs text-muted-foreground">
        localhost:3000
      </div>
    </div>
    {/* Content area */}
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center gap-3 bg-gradient-to-br p-8",
        gradient
      )}
    >
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="max-w-[240px] text-center text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export const ProductShowcase = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {showcaseItems.map((item) => (
        <BrowserChrome key={item.title} {...item} />
      ))}
    </div>
  );
};

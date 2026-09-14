import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Marquee from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/utils/avatar";

const showcaseProjects = [
  {
    name: "Fly5",
    username: "@fly5live",
    role: "FPV Team Site",
    company: "fly5.live",
    body: "Built and launched in 4 hours. Auth, team profiles, media gallery. Would've taken weeks otherwise.",
    img: getAvatarUrl("Fly5"),
  },
  {
    name: "FPV Bible",
    username: "@fpvbible",
    role: "Community Guide",
    company: "fpvbible.com",
    body: "Full FPV drone guide. CMS handles all the content, SEO just works. Went from repo clone to live site in a weekend.",
    img: getAvatarUrl("FPV Bible"),
  },
  {
    name: "Lacy Shell",
    username: "@lacysh",
    role: "AI Terminal",
    company: "lacy.sh",
    body: "Marketing site for an AI terminal app. Landing page, docs, downloads, payments. Didn't have to wire any of it up myself.",
    img: getAvatarUrl("Lacy Shell"),
  },
  {
    name: "Vibe Rehab",
    username: "@viberehab",
    role: "Dev Service",
    company: "vibe.rehab",
    body: "Service site with intake forms, pricing, CMS. Auth and payments just worked. Spent zero time on plumbing.",
    img: getAvatarUrl("Vibe Rehab"),
  },
  {
    name: "CrossOver",
    username: "@xaborofficial",
    role: "Desktop App",
    company: "crossover.lacymorrow.com",
    body: "Download page and docs for a desktop app with 1,100+ GitHub stars. Fast and does exactly what it needs to.",
    img: getAvatarUrl("CrossOver"),
  },
];

const firstRow = showcaseProjects.slice(0, Math.ceil(showcaseProjects.length / 2));
const secondRow = showcaseProjects.slice(Math.ceil(showcaseProjects.length / 2));

const ShowcaseCard = ({
  img,
  name,
  username,
  role,
  company,
  body,
}: {
  img: string;
  name: string;
  username: string;
  role: string;
  company: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-80 cursor-pointer overflow-hidden rounded-xl border p-4",
        "transform-gpu transition-all duration-300 ease-out hover:scale-[1.02]",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
      )}
    >
      <div className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium dark:text-white">{name}</figcaption>
            <p className="text-xs font-medium text-muted-foreground">
              {role} at {company}
            </p>
            <p className="text-xs font-medium dark:text-white/40">{username}</p>
          </div>
        </div>
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed">{body}</blockquote>
    </figure>
  );
};

export function SocialMarquee() {
  return (
    <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
      <Marquee pauseOnHover repeat={2} className="[--duration:40s]">
        {firstRow.map((project) => (
          <ShowcaseCard key={project.username} {...project} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover repeat={2} className="[--duration:35s]">
        {secondRow.map((project) => (
          <ShowcaseCard key={project.username} {...project} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background" />
    </div>
  );
}

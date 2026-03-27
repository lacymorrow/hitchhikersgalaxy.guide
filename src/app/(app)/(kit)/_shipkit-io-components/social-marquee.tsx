import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Marquee from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/utils/avatar";

const reviews = [
  {
    name: "Fly5",
    username: "@fly5live",
    role: "FPV Team Site",
    company: "fly5.live",
    body: "Built and launched in 4 hours. Auth, team profiles, media gallery. Would've taken weeks otherwise.",
    img: getAvatarUrl("Fly5"),
    verified: true,
  },
  {
    name: "FPV Bible",
    username: "@fpvbible",
    role: "Community Guide",
    company: "fpvbible.com",
    body: "Full FPV drone guide. CMS handles all the content, SEO just works. Went from repo clone to live site in a weekend.",
    img: getAvatarUrl("FPV Bible"),
    verified: true,
  },
  {
    name: "Lacy Shell",
    username: "@lacysh",
    role: "AI Terminal",
    company: "lacy.sh",
    body: "Marketing site for an AI terminal app. Landing page, docs, downloads, payments. Didn't have to wire any of it up myself.",
    img: getAvatarUrl("Lacy Shell"),
    verified: true,
  },
  {
    name: "Vibe Rehab",
    username: "@viberehab",
    role: "Dev Service",
    company: "vibe.rehab",
    body: "Service site with intake forms, pricing, CMS. Auth and payments just worked. Spent zero time on plumbing.",
    img: getAvatarUrl("Vibe Rehab"),
    verified: true,
  },
  {
    name: "CrossOver",
    username: "@xaborofficial",
    role: "Desktop App",
    company: "crossover.lacymorrow.com",
    body: "Download page and docs for a desktop app with 1,100+ GitHub stars. Fast and does exactly what it needs to.",
    img: getAvatarUrl("CrossOver"),
    verified: true,
  },
  {
    name: "Shipkit",
    username: "@shipkit",
    role: "This Site",
    company: "shipkit.io",
    body: "Yeah, this site runs on Shipkit too. Landing page, pricing, docs, auth, payments. If I'm going to sell it, I should be using it.",
    img: getAvatarUrl("Shipkit"),
    verified: true,
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  role,
  company,
  body,
  verified,
}: {
  img: string;
  name: string;
  username: string;
  role: string;
  company: string;
  body: string;
  verified?: boolean;
}) => {
  return (
    <figure
      className={cn(
        "relative w-80 cursor-pointer overflow-hidden rounded-xl border p-4",
        "transform-gpu transition-all duration-300 ease-out hover:scale-[1.02]",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
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
            <div className="flex items-center gap-2">
              <figcaption className="text-sm font-medium dark:text-white">{name}</figcaption>
              {verified && (
                <Badge variant="secondary" className="h-5 px-1">
                  Verified
                </Badge>
              )}
            </div>
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
      <Marquee pauseOnHover className="[--duration:40s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:35s]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background" />
    </div>
  );
}

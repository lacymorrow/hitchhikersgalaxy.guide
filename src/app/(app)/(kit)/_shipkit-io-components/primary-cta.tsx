import { Icon } from "@/components/assets/icon";
import { Link } from "@/components/primitives/link";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

export default function PrimaryCta() {
  return (
    <Link
      href={routes.external.buy}
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-11 rounded-xl px-8 font-medium",
        "bg-foreground text-background hover:bg-foreground/90",
        "transition-colors duration-200",
        "flex w-full items-center gap-2 md:w-auto"
      )}
    >
      <Icon className="size-5" /> Get {siteConfig.title}
    </Link>
  );
}

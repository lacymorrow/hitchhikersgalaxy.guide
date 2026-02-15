import { Icon } from "@/components/assets/icon";
import { RainbowButton } from "@/components/ui/magicui/rainbow-button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { Link } from "@/components/primitives/link";

export default function PrimaryCta() {
  return (
    <RainbowButton>
      <Link
        href={routes.external.buy}
        className="w-full md:w-auto flex items-center gap-2"
      >
        <Icon className="size-5" /> Get {siteConfig.title}
      </Link>
    </RainbowButton>
  );
}

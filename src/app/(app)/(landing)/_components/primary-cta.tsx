import { Logo } from "@/components/images/logo";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

export default function PrimaryCta() {
	return (
		<RainbowButton className="w-full md:w-auto flex items-center gap-2" href={routes.external.buy}>
			<Logo className="size-5" /> Get {siteConfig.name}
		</RainbowButton>
	);
}

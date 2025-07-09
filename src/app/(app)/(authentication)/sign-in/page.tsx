import { AuthenticationCard } from "@/app/(app)/(authentication)/_components/authentication-card";
import { SignIn } from "@/app/(app)/(authentication)/sign-in/_components/sign-in";
import { Icon } from "@/components/assets/icon";
import { Link } from "@/components/primitives/link-with-transition";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

export default function SignInPage() {
	return (
		<div className="flex w-full max-w-sm flex-col gap-6">
			<Link href={routes.home} className="flex items-center gap-2 self-center font-medium">
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
					<Icon />
				</div>
				{siteConfig.title}
			</Link>
			<AuthenticationCard>
				<SignIn />
			</AuthenticationCard>
		</div>
	);
}

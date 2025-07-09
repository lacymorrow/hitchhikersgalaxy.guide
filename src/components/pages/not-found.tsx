import { RocketIcon } from "lucide-react";
import { AppRouterLayout } from "@/components/layouts/app-router-layout";
import { Link } from "@/components/primitives/link-with-transition";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { WavesBackground } from "@/components/ui/background-waves";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const config = {
	speed: 0.002,
	saturation: 12,
	brightness: 60,
	amplitude: 1,
	frequency: 1,
	layers: 3,
	fadeOpacity: 0.05,
	transparent: true,
};

interface NotFoundPageProps {
	containerClassName?: string;
	descriptionClassName?: string;
}

const NoOpProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const NotFoundPage = ({ containerClassName, descriptionClassName }: NotFoundPageProps) => {
	return (
		<AppRouterLayout themeProvider={NoOpProvider}>
			<WavesBackground config={config} />
			<div className="container relative flex h-screen w-screen flex-col items-center justify-center">
				<div
					className={cn(
						"mx-auto flex max-w-[420px] flex-col items-center justify-center text-center",
						containerClassName
					)}
				>
					<div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
						<RocketIcon className="h-10 w-10 rotate-45 text-muted-foreground" />
					</div>
					<PageHeader className="bg-background/30 backdrop-blur-sm">
						<PageHeaderHeading className="w-full text-center">Lost in space</PageHeaderHeading>
						<PageHeaderDescription className={cn(descriptionClassName)}>
							The page you&apos;re looking for has drifted into deep space. Let&apos;s get you back
							to familiar territory.
						</PageHeaderDescription>
					</PageHeader>
					<Link
						href="/"
						className={cn(
							buttonVariants({
								variant: "default",
								size: "lg",
							}),
							"relative overflow-hidden"
						)}
					>
						<span className="relative z-10">Launch me back to earth</span>
						<div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary opacity-50 blur-xl transition-all duration-500 hover:opacity-75" />
					</Link>
					<p className="text-muted-foreground">
						We can&apos;t find the page you&apos;re looking for.
					</p>
				</div>
			</div>
		</AppRouterLayout>
	);
};

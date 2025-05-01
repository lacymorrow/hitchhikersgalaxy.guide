import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getConfig } from "@/app/(app)/[...slug]/config";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import { Link } from "@/components/primitives/link-with-transition";
import type { FC, HTMLAttributes, ReactNode } from "react";
import { v4 as uuid } from "uuid";

interface LinkItem {
	label: string;
	href: string;
}

type FooterItem = LinkItem | ReactNode;

interface FooterGroup {
	header: {
		label: string;
		href?: string;
	};
	items: FooterItem[];
}

type FooterElement = { type: "group"; content: FooterGroup } | { type: "node"; content: ReactNode };

const footerStyles = cva("flex flex-col gap-lg relative", {
	variants: {
		variant: {
			default: "flex-row items-center justify-between",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

interface FooterProps extends HTMLAttributes<HTMLDivElement> {
	variant?: VariantProps<typeof footerStyles>["variant"];
	groups?: FooterElement[];
	clientId?: string;
	showLogo?: boolean;
}

export const Footer: FC<FooterProps> = ({
	variant = "default",
	groups = [],
	clientId,
	showLogo = true,
	...props
}) => {
	const { className, ...rest } = props;

	// Get client-specific configuration
	const config = getConfig(clientId);

	// Apply client-specific styling
	const clientStyling = config?.styling || {};

	const groupElements = groups.map((element) => {
		if (element.type === "group") {
			const group = element.content;
			return (
				<div key={uuid()} className="mb-8 md:mb-0">
					{group.header.href ? (
						<Link href={group.header.href} className="mb-2 block font-semibold">
							{group.header.label}
						</Link>
					) : (
						<h3 className="mb-2 font-semibold">{group.header.label}</h3>
					)}
					<ul className="space-y-2">
						{group.items.map((item) => {
							const key = uuid();
							if (isLinkItem(item)) {
								return (
									<li key={key}>
										<Link
											className={cn(buttonVariants({ variant: "link" }), "p-0")}
											href={item.href}
										>
											{item.label}
										</Link>
									</li>
								);
							}
							return <li key={key}>{item}</li>;
						})}
					</ul>
				</div>
			);
		}
		return element.content;
	});

	return (
		<footer
			className={cn(footerStyles({ variant }), className)}
			{...rest}
			style={{
				// Apply client-specific secondary color if available
				...(clientStyling.secondaryColor && {
					'--brand-secondary': clientStyling.secondaryColor
				} as React.CSSProperties)
			}}
		>
			<div className="container relative flex md:min-h-80 w-full flex-col items-stretch gap-2xl py-2xl">
				<div className="flex flex-col lg:flex-row justify-between gap-2xl">
					<div className="flex flex-col gap-2xl">
						{showLogo && (
							<Link href={routes.home}>
								<div className="flex items-center gap-2">
									<img src="/placeholder-logo.svg" alt={siteConfig.name} className="h-10 w-auto" />
									<h1 className="text-2xl font-bold">{siteConfig.name}</h1>
								</div>
							</Link>
						)}
					</div>
					<div className="flex flex-col flex-wrap md:flex-row lg:gap-20">{groupElements}</div>
				</div>

				{/* Branding based on white-label config */}
				{config.branding.showPoweredBy && (
					<div className="mt-8 text-sm text-gray-500 text-center border-t pt-4">
						{config.branding.brandingText}
					</div>
				)}

				{config.branding.customFooterText && (
					<div className="mt-2 text-xs text-gray-400 text-center">
						{config.branding.customFooterText}
					</div>
				)}
			</div>
		</footer>
	);
};

// Type guard for LinkItem
function isLinkItem(item: FooterItem): item is LinkItem {
	return item !== null && typeof item === "object" && "href" in item && "label" in item;
}

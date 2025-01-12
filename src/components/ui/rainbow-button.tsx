import { cn } from "@/lib/utils";
import { Link } from 'next-view-transitions';
import { type LinkProps } from "next/link";
import { type ReactNode } from "react";

// Common styles shared between button and link
const commonStyles = {
	base: "group relative inline-flex h-11 animate-rainbow cursor-pointer items-center justify-center rounded-xl border-0 bg-[length:200%] px-8 py-2 font-medium text-primary-foreground transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
	before:
		"before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",
	lightMode:
		"bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
	darkMode:
		"dark:bg-[linear-gradient(#fff,#fff),linear-gradient(#fff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
};

type RainbowButtonProps = {
	className?: string;
	children: ReactNode;
} & (
		| ({ href: string } & Omit<LinkProps, "href"> &
			React.AnchorHTMLAttributes<HTMLAnchorElement>)
		| ({ href?: never } & React.ButtonHTMLAttributes<HTMLButtonElement>)
	);

export const RainbowButton = ({
	children,
	className,
	href,
	...props
}: RainbowButtonProps) => {
	const styles = cn(
		commonStyles.base,
		commonStyles.before,
		commonStyles.lightMode,
		commonStyles.darkMode,
		className,
	);

	if (href) {
		return (
			<Link
				href={href}
				className={styles}
				{...(props as Omit<LinkProps, "href">)}
			>
				{children}
			</Link>
		);
	}

	return (
		<button
			className={styles}
			{...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
		>
			{children}
		</button>
	);
};

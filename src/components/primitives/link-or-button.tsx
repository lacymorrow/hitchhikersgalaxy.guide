import type React from "react";
import type { ReactNode } from "react";
import { Link } from "@/components/primitives/link-with-transition";
import { Button } from "@/components/ui/button";

interface CommonProps {
	className?: string;
	children: ReactNode;
}

interface LinkProps extends CommonProps {
	href: string;
	variant?: "link";
}

interface ButtonProps extends CommonProps {
	variant?: Exclude<React.ComponentProps<typeof Button>["variant"], "link">;
	type?: "button" | "submit" | "reset";
	onClick?: () => void;
}

type LinkOrButtonProps = LinkProps | ButtonProps;

export const LinkOrButton = (props: LinkOrButtonProps) => {
	if ("href" in props) {
		const { className, children, href, ...rest } = props;
		return (
			<Link className={className} href={href} {...rest}>
				{children}
			</Link>
		);
	}

	const { className, children, type = "button", ...rest } = props;
	return (
		<Button className={className} type={type} {...rest}>
			{children}
		</Button>
	);
};

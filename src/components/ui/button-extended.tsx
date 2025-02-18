import { cn } from "@/lib/utils";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariantsx = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
				outline:
					"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-8",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

interface IconProps {
	Icon: React.ElementType;
	iconplacement: "left" | "right";
}

interface IconRefProps {
	Icon?: never;
	iconplacement?: undefined;
}

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariantsx> {
	asChild?: boolean;
}

export type ButtonIconProps = IconProps | IconRefProps;

const Buttonx = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & ButtonIconProps
>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			Icon,
			iconplacement,
			children,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariantsx({ variant, size, className }))}
				ref={ref}
				{...props}
			>
				{Icon && iconplacement === "left" && <Icon />}
				<Slottable>{children}</Slottable>
				{Icon && iconplacement === "right" && <Icon />}
			</Comp>
		);
	},
);
Buttonx.displayName = "Buttonx";

export { buttonVariantsx, Buttonx };

/**
 * @description A versatile button component with multiple variants and sizes
 * @author ShipKit Team
 * @version 1.0.0
 * @status stable
 * @since 1.0.0
 * @license MIT
 *
 * @example Basic Usage
 * ```tsx
 * <Button>Click me</Button>
 * ```
 *
 * @example Variants
 * ```tsx
 * <div className="flex gap-4">
 *   <Button variant="primary">Primary</Button>
 *   <Button variant="secondary">Secondary</Button>
 *   <Button variant="outline">Outline</Button>
 * </div>
 * ```
 *
 * @example Sizes
 * ```tsx
 * <div className="flex items-center gap-4">
 *   <Button size="sm">Small</Button>
 *   <Button size="md">Medium</Button>
 *   <Button size="lg">Large</Button>
 * </div>
 * ```
 */

"use client";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary/90",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				outline: "border border-input hover:bg-accent hover:text-accent-foreground",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "underline-offset-4 hover:underline text-primary",
			},
			size: {
				sm: "h-9 px-3 rounded-md",
				md: "h-10 py-2 px-4 rounded-md",
				lg: "h-11 px-8 rounded-md",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	}
);

/**
 * Button component props
 */
export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
	VariantProps<typeof buttonVariants> {
	/**
	 * Whether to render the button as a child component
	 * @default false
	 */
	asChild?: boolean;
	/**
	 * The visual style variant of the button
	 * @default "primary"
	 */
	variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
	/**
	 * The size of the button
	 * @default "md"
	 */
	size?: "sm" | "md" | "lg" | "icon";
}

/**
 * A versatile button component with multiple variants and sizes
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }), "bg-primary text-primary-foreground hover:bg-primary/90")}
				ref={ref}
				{...props}
			/>
		);
	}
);

Button.displayName = "Button";

export { Button, buttonVariants };

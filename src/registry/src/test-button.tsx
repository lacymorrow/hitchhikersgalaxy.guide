/**
 * @component TestButton
 * @description A test button component to verify the documentation generation system
 * @status beta
 * @version 0.1.0
 * @author ShipKit Team
 * @repository https://github.com/shipkit/shipkit
 * @bugs https://github.com/shipkit/shipkit/issues
 *
 * @preview
 * ```tsx
 * <TestButton variant="primary" size="md">
 *   Click me
 * </TestButton>
 * ```
 * @previewHeight 100px
 * @previewBackground #ffffff
 * @previewVariant dark - #1a1a1a - dark
 * @previewVariant light - #ffffff
 * @previewVariant accent - #f0f0f0
 *
 * @example Basic Usage
 * A simple primary button with default settings
 * ```tsx
 * <TestButton variant="primary">Default Button</TestButton>
 * ```
 * @test Click handler - Should call onClick when clicked
 * @test Disabled state - Should not call onClick when disabled
 *
 * @example With Icon
 * Using the button with an icon for enhanced visual feedback
 * ```tsx
 * <TestButton variant="secondary" icon={<IconPlus />}>
 *   Add Item
 * </TestButton>
 * ```
 * @test Icon rendering - Should render icon when provided
 *
 * @example Loading State
 * Button shows a loading spinner and disables interaction
 * ```tsx
 * <TestButton loading>Processing...</TestButton>
 * ```
 * @test Loading state - Should show spinner and disable button
 *
 * @prop variant - The visual style of the button - primary | secondary | ghost | destructive - default: primary
 * @prop size - The size of the button - sm | md | lg | xl - default: md
 * @prop icon - Optional icon component to display - ReactNode
 * @prop fullWidth - Whether the button should take full width - boolean - default: false
 * @prop loading - Shows a loading spinner and disables the button - boolean - default: false - required
 *
 * @state isPressed - Tracks the pressed state of the button - boolean - default: false
 * @state isFocused - Tracks the focus state for keyboard navigation - boolean - default: false
 * @state isHovered - Tracks hover state for animations - boolean - default: false
 *
 * @dependency react - ^18.0.0 - npm
 * @dependency lucide-react - ^0.292.0 - npm
 * @dependency @/lib/utils - workspace:* - internal
 * @dependency tailwind-variants - ^0.1.0 - style
 *
 * @do Use clear, action-oriented button text
 * @do Include an icon when it helps clarify the action
 * @do Use destructive variant for dangerous actions
 * @dont Don't use long text in buttons
 * @dont Don't use multiple primary buttons in close proximity
 *
 * @note Buttons automatically manage focus states
 * @note Loading state prevents multiple clicks
 * @note Use aria-label for icon-only buttons
 *
 * @accessibility
 * Follows ARIA button pattern with proper roles and states.
 * Supports keyboard navigation and screen readers.
 * Implements WCAG 2.1 success criteria:
 * - 2.1.1 Keyboard (Level A)
 * - 2.1.2 No Keyboard Trap (Level A)
 * - 2.4.7 Focus Visible (Level AA)
 *
 * @customization
 * Customizable via CSS variables:
 * --test-button-primary-bg: Background color for primary variant
 * --test-button-primary-text: Text color for primary variant
 * --test-button-border-radius: Border radius for all variants
 * --test-button-focus-ring: Focus ring color and style
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";

export interface TestButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "destructive";
	size?: "sm" | "md" | "lg" | "xl";
	icon?: React.ReactNode;
	fullWidth?: boolean;
	loading?: boolean;
}

export const TestButton = React.forwardRef<HTMLButtonElement, TestButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			icon,
			fullWidth = false,
			loading = false,
			disabled,
			children,
			...props
		},
		ref
	) => {
		const [isPressed, setIsPressed] = React.useState(false);
		const [isFocused, setIsFocused] = React.useState(false);
		const [isHovered, setIsHovered] = React.useState(false);

		const styles = {
			base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary/90",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
			},
			size: {
				sm: "h-8 px-3 text-xs",
				md: "h-10 px-4 py-2",
				lg: "h-11 px-8",
				xl: "h-12 px-10 text-lg",
			},
			fullWidth: "w-full",
			pressed: isPressed ? "scale-95" : "",
			focused: isFocused ? "ring-2" : "",
			hovered: isHovered ? "brightness-105" : "",
		};

		return (
			<button
				ref={ref}
				disabled={disabled || loading}
				className={cn(
					styles.base,
					styles.variant[variant],
					styles.size[size],
					fullWidth && styles.fullWidth,
					styles.pressed,
					styles.focused,
					styles.hovered,
					className
				)}
				onMouseDown={() => setIsPressed(true)}
				onMouseUp={() => setIsPressed(false)}
				onMouseLeave={() => {
					setIsPressed(false);
					setIsHovered(false);
				}}
				onMouseEnter={() => setIsHovered(true)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				{...props}
			>
				{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
				{!loading && icon && <span className="mr-2">{icon}</span>}
				{children}
			</button>
		);
	}
);

TestButton.displayName = "TestButton";

"use client";

/**
 * A comprehensive test component that showcases all features detectable by the registry generator.
 * @author Test Team
 * @version 1.0.0
 * @since 0.1.0
 * @see https://example.com/docs
 * @example
 * ```tsx
 * <TestComponent
 *   label="Test"
 *   onAction={() => console.log('clicked')}
 *   theme="dark"
 * />
 * ```
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/components/ui/theme";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

// Test CSS variables detection
const styles = {
	container: {
		"--test-color": "blue",
		"--test-size": "1rem",
	} as Record<string, string>,
};

// Test complex type detection
type Theme = "light" | "dark" | "system";
type Size = "sm" | "lg" | "default" | "icon";

interface TestComponentProps {
	/** The main label text */
	label: string;
	/** Optional secondary description */
	description?: string;
	/** The visual theme to use */
	theme?: Theme;
	/** The size variant */
	size?: Size;
	/** Whether the component is disabled */
	disabled?: boolean;
	/** Array of items to display */
	items?: Array<{
		id: string;
		title: string;
	}>;
	/** Record of key-value pairs */
	metadata?: Record<string, string>;
	/** Callback when action is triggered */
	onAction?: () => void;
	/** Callback when value changes */
	onChange?: (value: string) => void;
	/** Callback when component mounts */
	onMount?: () => void;
	/** Custom CSS classes */
	className?: string;
}

export const TestComponent = ({
	label,
	description,
	theme = "light",
	size = "default",
	disabled = false,
	items = [],
	metadata = {},
	onAction,
	onChange,
	onMount,
	className,
}: TestComponentProps) => {
	// Test hooks detection
	const [value, setValue] = useState("");
	const [isOpen, setIsOpen] = useState(false);

	const handleAction = useCallback(() => {
		onAction?.();
	}, [onAction]);

	useEffect(() => {
		onMount?.();
	}, [onMount]);

	// Test Tailwind classes and variants
	return (
		<ThemeProvider>
			<motion.div
				className={cn(
					"bg-[--test-color]",
					"flex flex-col gap-4 p-4 rounded-lg",
					"bg-background text-foreground",
					"hover:bg-muted",
					"md:flex-row",
					disabled && "opacity-50 cursor-not-allowed",
					className
				)}
				style={styles.container}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
			>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold tracking-tight">{label}</h3>
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Input
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							onChange?.(e.target.value);
						}}
						placeholder="Type something..."
						className="w-[200px]"
						disabled={disabled}
					/>
					<Button
						onClick={handleAction}
						disabled={disabled}
						variant="default"
						size={size}
					>
						Action
					</Button>
				</div>

				{items.length > 0 && (
					<ul className="list-disc list-inside">
						{items.map((item) => (
							<li key={item.id} className="text-sm">
								{item.title}
							</li>
						))}
					</ul>
				)}

				{Object.entries(metadata).map(([key, value]) => (
					<div key={key} className="text-xs text-muted-foreground">
						{key}: {value}
					</div>
				))}
			</motion.div>
		</ThemeProvider>
	);
};

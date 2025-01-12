"use client";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, Copy, LucideIcon } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
	value: string;
	tooltip?: string;
	icon?: LucideIcon;
	className?: string;
	variant?: "outline" | "ghost";
}

export function CopyButton({
	value,
	tooltip,
	icon: Icon = Copy,
	className,
	variant = "ghost",
	...props
}: CopyButtonProps) {
	const [hasCopied, setHasCopied] = useState(false);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(value);
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy text:", error);
		}
	}

	const button = (
		<Button
			size="icon"
			variant={variant}
			className={cn(
				"relative h-8 w-8 text-muted-foreground hover:bg-muted",
				className
			)}
			onClick={copyToClipboard}
			{...props}
		>
			{hasCopied ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
			<span className="sr-only">Copy</span>
		</Button>
	);

	if (!tooltip) return button;

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent>
					<p>{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

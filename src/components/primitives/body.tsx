import { fontSans, fontSerif } from "@/config/fonts";
import { cn } from "@/lib/utils";

export function Body({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<body
			className={cn(
				"min-h-screen antialiased",
				"font-sans font-normal leading-relaxed",
				fontSans.variable,
				fontSerif.variable,
				className
			)}
		>
			{children}
		</body>
	);
}

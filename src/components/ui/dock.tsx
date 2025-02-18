"use client";

import React, { type PropsWithChildren, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps, type MotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

export interface DockProps extends VariantProps<typeof dockVariants> {
	className?: string;
	magnification?: number;
	distance?: number;
	direction?: "top" | "middle" | "bottom";
	children: React.ReactNode;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva(
	"supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto mt-8 flex h-[58px] w-max gap-2 rounded-2xl border p-2 backdrop-blur-md",
);

const DockContext = React.createContext<{
	mouseX: MotionValue<number>;
	magnification: number;
	distance: number;
}>({
	mouseX: useMotionValue(Infinity),
	magnification: DEFAULT_MAGNIFICATION,
	distance: DEFAULT_DISTANCE,
});

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
	(
		{
			className,
			children,
			magnification = DEFAULT_MAGNIFICATION,
			distance = DEFAULT_DISTANCE,
			direction = "bottom",
			...props
		},
		ref,
	) => {
		const mouseX = useMotionValue(Infinity);

		return (
			<DockContext.Provider value={{ mouseX, magnification, distance }}>
				<motion.div
					ref={ref}
					onMouseMove={(e) => mouseX.set(e.pageX)}
					onMouseLeave={() => mouseX.set(Infinity)}
					{...props}
					className={cn(dockVariants({ className }), {
						"items-start": direction === "top",
						"items-center": direction === "middle",
						"items-end": direction === "bottom",
					})}
				>
					{children}
				</motion.div>
			</DockContext.Provider>
		);
	},
);

Dock.displayName = "Dock";

export interface DockIconProps extends Omit<HTMLMotionProps<"div">, "children"> {
	size?: number;
	children?: React.ReactNode;
}

const DockIcon = ({
	size,
	className,
	children,
	...props
}: DockIconProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const { mouseX, magnification, distance } = React.useContext(DockContext);

	const distanceCalc = useTransform(mouseX, (val: number) => {
		const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
		return val - bounds.x - bounds.width / 2;
	});

	const widthSync = useTransform(
		distanceCalc,
		[-distance, 0, distance],
		[40, magnification, 40],
	);

	const width = useSpring(widthSync, {
		mass: 0.1,
		stiffness: 150,
		damping: 12,
	});

	return (
		<motion.div
			ref={ref}
			style={{ width }}
			className={cn(
				"flex aspect-square cursor-pointer items-center justify-center rounded-full",
				className,
			)}
			{...props}
		>
			{children}
		</motion.div>
	);
};

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon, dockVariants };

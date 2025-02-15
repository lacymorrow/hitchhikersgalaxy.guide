"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type RegistryItem } from "@/lib/types";
import { useEffect, useState } from "react";
import {
	getDependencies,
	getInstalledComponents,
	getProjectRoot,
} from "../actions";

interface ComponentStatsProps {
	selectedItem: RegistryItem | null;
}

interface DependencyStats {
	total: number;
	installed: number;
	missing: string[];
}

export function ComponentStats({ selectedItem }: ComponentStatsProps) {
	const [stats, setStats] = useState<{
		dependencies: DependencyStats;
		registryDependencies: DependencyStats;
		installedComponents: string[];
	} | null>(null);

	useEffect(() => {
		const loadStats = async () => {
			if (!selectedItem) return;

			try {
				const [deps, components] = await Promise.all([
					getDependencies(await getProjectRoot()),
					getInstalledComponents(await getProjectRoot()),
				]);

				const allDeps = { ...deps.dependencies, ...deps.devDependencies };

				// Check dependencies
				const dependencies: DependencyStats = {
					total: selectedItem.dependencies?.length || 0,
					installed: 0,
					missing: [],
				};

				selectedItem.dependencies?.forEach((dep) => {
					const [name] = dep.split("@");
					if (name in allDeps) {
						dependencies.installed++;
					} else {
						dependencies.missing.push(dep);
					}
				});

				// Check registry dependencies
				const registryDependencies: DependencyStats = {
					total: selectedItem.registryDependencies?.length || 0,
					installed: 0,
					missing: [],
				};

				selectedItem.registryDependencies?.forEach((dep) => {
					if (components.includes(dep)) {
						registryDependencies.installed++;
					} else {
						registryDependencies.missing.push(dep);
					}
				});

				setStats({
					dependencies,
					registryDependencies,
					installedComponents: components,
				});
			} catch (error) {
				console.error("Failed to load stats:", error);
			}
		};

		loadStats();
	}, [selectedItem]);

	if (!selectedItem || !stats) {
		return null;
	}

	return (
		<div className="grid gap-4 md:grid-cols-2">
			{/* Dependencies */}
			<Card className="p-4">
				<h3 className="font-semibold">Dependencies</h3>
				<div className="mt-2">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span>
							{stats.dependencies.installed} / {stats.dependencies.total}{" "}
							installed
						</span>
						<span className="text-muted-foreground">
							{stats.dependencies.total
								? Math.round(
									(stats.dependencies.installed / stats.dependencies.total) *
									100
								)
								: 100}
							%
						</span>
					</div>
					<Progress
						value={
							(stats.dependencies.installed / stats.dependencies.total) * 100
						}
					/>
				</div>
				{stats.dependencies.missing.length > 0 && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">
							Missing dependencies:
						</p>
						<div className="mt-1 space-x-1">
							{stats.dependencies.missing.map((dep) => (
								<span
									key={dep}
									className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-destructive"
								>
									{dep}
								</span>
							))}
						</div>
					</div>
				)}
			</Card>

			{/* Registry Dependencies */}
			<Card className="p-4">
				<h3 className="font-semibold">Registry Dependencies</h3>
				<div className="mt-2">
					<div className="mb-2 flex items-center justify-between text-sm">
						<span>
							{stats.registryDependencies.installed} /{" "}
							{stats.registryDependencies.total} installed
						</span>
						<span className="text-muted-foreground">
							{stats.registryDependencies.total
								? Math.round(
									(stats.registryDependencies.installed /
										stats.registryDependencies.total) *
									100
								)
								: 100}
							%
						</span>
					</div>
					<Progress
						value={
							(stats.registryDependencies.installed /
								stats.registryDependencies.total) *
							100
						}
					/>
				</div>
				{stats.registryDependencies.missing.length > 0 && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">Missing components:</p>
						<div className="mt-1 space-x-1">
							{stats.registryDependencies.missing.map((dep) => (
								<span
									key={dep}
									className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-destructive"
								>
									{dep}
								</span>
							))}
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}

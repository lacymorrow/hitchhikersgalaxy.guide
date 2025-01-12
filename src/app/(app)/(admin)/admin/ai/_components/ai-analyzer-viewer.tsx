"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { aiAnalyzer } from "@/lib/ai/ai-analyzer";
import { useState } from "react";

export const AIAnalyzerViewer = () => {
	const insights = aiAnalyzer.getCodebaseInsights();
	const [selectedFeature, setSelectedFeature] = useState("authentication");

	const featureGuide =
		aiAnalyzer.getFeatureImplementationGuide(selectedFeature);
	const pitfalls = aiAnalyzer.getPitfalls();
	const tools = aiAnalyzer.getRecommendedTools("forms");
	const optimizations = aiAnalyzer.getPerformanceOptimizations();

	return (
		<div className="space-y-8">
			<div>
				<h3 className="mb-4 font-medium">Feature Implementation Guide</h3>
				<Select value={selectedFeature} onValueChange={setSelectedFeature}>
					<SelectTrigger>
						<SelectValue placeholder="Select a feature" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="authentication">Authentication</SelectItem>
						<SelectItem value="database">Database</SelectItem>
						<SelectItem value="api">API</SelectItem>
						<SelectItem value="ui">UI Components</SelectItem>
					</SelectContent>
				</Select>
				<div className="mt-4 space-y-2">
					{featureGuide.map((step) => (
						<div key={step} className="text-sm text-muted-foreground">
							{step}
						</div>
					))}
				</div>
			</div>

			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="insights">
					<AccordionTrigger>Codebase Insights</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-4">
							{Object.entries(insights).map(([key, value]) => (
								<div key={key} className="space-y-2">
									<h3 className="font-medium capitalize">
										{key.replace(/([A-Z])/g, " $1")}
									</h3>
									<ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
										{value.map((item: string) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="pitfalls">
					<AccordionTrigger>Common Pitfalls</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
							{pitfalls.map((pitfall) => (
								<li key={pitfall}>{pitfall}</li>
							))}
						</ul>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="tools">
					<AccordionTrigger>Recommended Tools</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
							{tools.map((tool) => (
								<li key={tool}>{tool}</li>
							))}
						</ul>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="optimizations">
					<AccordionTrigger>Performance Optimizations</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
							{optimizations.map((optimization) => (
								<li key={optimization}>{optimization}</li>
							))}
						</ul>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
};

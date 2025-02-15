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
import { aiAssistant } from "@/lib/ai/ai-assistant";
import type { TechnologyStack } from "@/lib/ai/ai-loader";
import { useState } from "react";

export const AIAssistantViewer = () => {
	const [selectedFeature, setSelectedFeature] = useState("authentication");
	const [selectedTech, setSelectedTech] =
		useState<keyof TechnologyStack>("framework");

	const guidance = aiAssistant.getImplementationGuidance(selectedFeature);
	const guidelines = aiAssistant.getCodeReviewGuidelines();
	const practices = aiAssistant.getTechnologyBestPractices(selectedTech);
	const fileStructure = aiAssistant.getFileStructureRecommendations("page");
	const security = aiAssistant.getSecurityGuidelines();

	return (
		<div className="space-y-8">
			<div>
				<h3 className="mb-4 font-medium">Implementation Guidance</h3>
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

				<div className="mt-4 space-y-4">
					<div>
						<h4 className="font-medium">Approach</h4>
						<div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
							{guidance.approach}
						</div>
					</div>

					<div>
						<h4 className="font-medium">Reasoning</h4>
						<ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
							{guidance.reasoning.map((reason) => (
								<li key={reason}>{reason}</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="font-medium">Key Considerations</h4>
						<ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
							{guidance.considerations.map((consideration) => (
								<li key={consideration}>{consideration}</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			<div>
				<h3 className="mb-4 font-medium">Technology Best Practices</h3>
				<Select
					value={selectedTech}
					onValueChange={(value) =>
						setSelectedTech(value as keyof TechnologyStack)
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a technology" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="framework">Framework</SelectItem>
						<SelectItem value="language">Language</SelectItem>
						<SelectItem value="styling">Styling</SelectItem>
						<SelectItem value="ui">UI</SelectItem>
						<SelectItem value="state">State Management</SelectItem>
						<SelectItem value="database">Database</SelectItem>
						<SelectItem value="cms">CMS</SelectItem>
						<SelectItem value="email">Email</SelectItem>
						<SelectItem value="auth">Authentication</SelectItem>
					</SelectContent>
				</Select>

				<ul className="mt-4 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
					{practices.map((practice) => (
						<li key={practice}>{practice}</li>
					))}
				</ul>
			</div>

			<Accordion type="single" collapsible className="w-full">
				<AccordionItem value="review">
					<AccordionTrigger>Code Review Guidelines</AccordionTrigger>
					<AccordionContent>
						<div className="space-y-4">
							{Object.entries(guidelines).map(([key, value]) => (
								<div key={key} className="space-y-2">
									<h3 className="font-medium capitalize">{key}</h3>
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

				<AccordionItem value="structure">
					<AccordionTrigger>File Structure</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
							{fileStructure.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</AccordionContent>
				</AccordionItem>

				<AccordionItem value="security">
					<AccordionTrigger>Security Guidelines</AccordionTrigger>
					<AccordionContent>
						<ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
							{security.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
};

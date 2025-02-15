"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { aiLoader } from "@/lib/ai/ai-loader";

export const AIContextViewer = () => {
	const context = aiLoader.getContext();

	return (
		<Accordion type="single" collapsible className="w-full">
			<AccordionItem value="technologies">
				<AccordionTrigger>Technology Stack</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-4">
						{Object.entries(context.technologies).map(([key, value]) => (
							<div key={key} className="space-y-2">
								<h3 className="font-medium capitalize">{key}</h3>
								<div className="flex flex-wrap gap-2">
									{Array.isArray(value) ? (
										value.map((item) => (
											<Badge key={item} variant="secondary">
												{item}
											</Badge>
										))
									) : (
										<Badge variant="secondary">{value}</Badge>
									)}
								</div>
							</div>
						))}
					</div>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="structure">
				<AccordionTrigger>Project Structure</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-4">
						{Object.entries(context.structure.directories).map(
							([key, value]) => (
								<div key={key} className="space-y-2">
									<h3 className="font-medium capitalize">{key}</h3>
									<div className="space-y-1">
										{value.map((item) => (
											<div key={item} className="text-sm text-muted-foreground">
												{item}
											</div>
										))}
									</div>
								</div>
							),
						)}
					</div>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="conventions">
				<AccordionTrigger>Coding Conventions</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-4">
						{Object.entries(context.conventions).map(([key, value]) => (
							<div key={key} className="space-y-2">
								<h3 className="font-medium capitalize">{key}</h3>
								<ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
									{value.map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</AccordionContent>
			</AccordionItem>

			<AccordionItem value="files">
				<AccordionTrigger>Key Files</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-2">
						{Object.entries(context.structure.keyFiles).map(
							([file, description]) => (
								<div key={file} className="space-y-1">
									<div className="font-mono text-sm">{file}</div>
									<div className="text-sm text-muted-foreground">
										{description}
									</div>
								</div>
							),
						)}
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
};

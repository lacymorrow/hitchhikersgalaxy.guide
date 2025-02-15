import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAnalyzerViewer } from "./_components/ai-analyzer-viewer";
import { AIAssistantViewer } from "./_components/ai-assistant-viewer";
import { AIContextViewer } from "./_components/ai-context-viewer";

export const metadata = {
	title: "AI System",
	description:
		"AI loader system for onboarding and assisting AI programming assistants",
};

export default function AIPage() {
	return (
		<div className="container mx-auto py-10">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">AI System</h1>
				<p className="mt-2 text-muted-foreground">
					Explore the AI loader system that helps onboard and assist AI
					programming assistants.
				</p>
			</div>

			<Tabs defaultValue="context" className="space-y-4">
				<TabsList>
					<TabsTrigger value="context">Context</TabsTrigger>
					<TabsTrigger value="analyzer">Analyzer</TabsTrigger>
					<TabsTrigger value="assistant">Assistant</TabsTrigger>
				</TabsList>

				<TabsContent value="context">
					<Card>
						<CardHeader>
							<CardTitle>Project Context</CardTitle>
							<CardDescription>
								Essential information about the project structure, technologies,
								and conventions.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<AIContextViewer />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analyzer">
					<Card>
						<CardHeader>
							<CardTitle>Codebase Analysis</CardTitle>
							<CardDescription>
								Insights about patterns, best practices, and common pitfalls.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<AIAnalyzerViewer />
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="assistant">
					<Card>
						<CardHeader>
							<CardTitle>Implementation Assistant</CardTitle>
							<CardDescription>
								Guidance on implementing features and following best practices.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<AIAssistantViewer />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

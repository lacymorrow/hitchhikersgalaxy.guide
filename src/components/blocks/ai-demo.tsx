"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Send, Sparkles, Terminal, Wand2 } from "lucide-react";
import * as React from "react";

const demoPrompts = [
	"Generate a product description",
	"Analyze this customer feedback",
	"Create an email template",
	"Suggest SEO improvements",
] as const;

const demoResponses = {
	"Generate a product description": "🚀 Your AI-powered SaaS platform helps businesses automate customer support with intelligent chatbots. Using cutting-edge natural language processing, it understands customer intent and provides accurate, personalized responses 24/7.",
	"Analyze this customer feedback": "📊 Analysis complete! The sentiment is positive (score: 0.85). Key themes: ease of use, fast implementation, helpful support. Suggested improvements: more customization options.",
	"Create an email template": "📧 Welcome aboard! \n\nWe're thrilled to have you join [Company Name]. Your account is now ready to use. Here's what you can do next:\n\n1. Complete your profile\n2. Explore our features\n3. Schedule an onboarding call\n\nNeed help? Our team is here 24/7.",
	"Suggest SEO improvements": "🔍 SEO Recommendations:\n1. Add meta descriptions\n2. Optimize image alt tags\n3. Improve mobile responsiveness\n4. Create XML sitemap\n5. Add schema markup",
} as const;

export const AIDemo: React.FC = () => {
	const [prompt, setPrompt] = React.useState("");
	const [response, setResponse] = React.useState("");
	const [loading, setLoading] = React.useState(false);
	const [selectedDemo, setSelectedDemo] = React.useState("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		// Simulate API call
		setTimeout(() => {
			setResponse(demoResponses[selectedDemo as keyof typeof demoResponses] || "Try one of our example prompts!");
			setLoading(false);
		}, 1000);
	};

	const handleDemoClick = (prompt: string) => {
		setPrompt(prompt);
		setSelectedDemo(prompt);
	};

	return (
		<div className="w-full max-w-4xl mx-auto">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
				<Card className="p-6 relative overflow-hidden">
					<div className="absolute top-0 right-0 p-2">
						<Bot className="h-5 w-5 text-primary" />
					</div>
					<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
						<Terminal className="h-4 w-4" />
						Try the Demo
					</h3>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Textarea
								placeholder="Enter your prompt or select an example below..."
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								className="min-h-[100px]"
							/>
						</div>
						<Button type="submit" disabled={loading || !prompt} className="w-full">
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : (
								<Send className="h-4 w-4 mr-2" />
							)}
							Generate Response
						</Button>
					</form>
					<div className="mt-4">
						<p className="text-sm text-gray-500 mb-2">Try these examples:</p>
						<div className="flex flex-wrap gap-2">
							{demoPrompts.map((demoPrompt) => (
								<button
									key={demoPrompt}
									type="button"
									onClick={() => handleDemoClick(demoPrompt)}
									className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selectedDemo === demoPrompt
										? "bg-primary text-primary-foreground"
										: "bg-secondary hover:bg-secondary/80"
										}`}
								>
									{demoPrompt}
								</button>
							))}
						</div>
					</div>
				</Card>
				<Card className="p-6 relative overflow-hidden">
					<div className="absolute top-0 right-0 p-2">
						<Sparkles className="h-5 w-5 text-yellow-500" />
					</div>
					<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
						<Wand2 className="h-4 w-4" />
						AI Response
					</h3>
					<div className="min-h-[200px] bg-muted/50 rounded-lg p-4">
						{loading ? (
							<div className="flex items-center justify-center h-full">
								<Loader2 className="h-6 w-6 animate-spin text-primary" />
							</div>
						) : response ? (
							<div className="whitespace-pre-wrap">{response}</div>
						) : (
							<div className="text-gray-500 text-center h-full flex items-center justify-center">
								Select an example or enter your own prompt to see the AI in action
							</div>
						)}
					</div>
				</Card>
			</div>
			<div className="text-center">
				<p className="text-sm text-gray-500">
					This is a demo of our AI capabilities. The full version includes more features,
					custom training, and enterprise-grade security.
				</p>
			</div>
		</div>
	);
};

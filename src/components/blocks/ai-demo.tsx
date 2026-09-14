// @ts-nocheck

"use client";

import { Bot, Loader2, Send, Sparkles, Terminal, Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import Script from "next/script";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

// Fix the dynamic import to specifically import the default export
const AISmollmWebGPU = dynamic(
  async () => {
    const module = await import("@/components/blocks/ai/smollm-web/ai-smollm-webgpu");
    return module.AISmollmWebGPU;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    ),
  }
);

const demoPrompts = [
  "What is the meaning of life?",
  "Write a haiku about coding",
  "Explain quantum computing",
  "Tell me a joke about AI",
] as const;

export const AIDemo: React.FC = () => {
  const [prompt, setPrompt] = React.useState("");
  const [response, setResponse] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selectedDemo, setSelectedDemo] = React.useState("");
  const [isAIReady, setIsAIReady] = React.useState(false);

  // Initialize MathJax
  React.useEffect(() => {
    window.MathJax = {
      tex: {
        inlineMath: [
          ["$", "$"],
          ["\\(", "\\)"],
        ],
      },
      svg: {
        fontCache: "global",
      },
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(""); // Clear previous response

    try {
      // Here we'll integrate with the AI model
      // This is a placeholder until we have access to the actual AI interface
      // You'll need to replace this with the actual AI interaction
      const result = await window.aiModel?.generate(prompt);
      setResponse(result || "AI model not ready. Please try again in a moment.");
    } catch (error) {
      console.error("AI Generation error:", error);
      setResponse("Sorry, there was an error generating the response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (prompt: string) => {
    setPrompt(prompt);
    setSelectedDemo(prompt);
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Script
        id="mathjax-script"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="lazyOnload"
      />

      <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute right-0 top-0 p-2">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
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
            <Button type="submit" disabled={loading || !prompt || !isAIReady} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Generate Response
            </Button>
          </form>
          <div className="mt-4">
            <p className="mb-2 text-sm text-gray-500">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {demoPrompts.map((demoPrompt) => (
                <button
                  key={demoPrompt}
                  type="button"
                  onClick={() => handleDemoClick(demoPrompt)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    selectedDemo === demoPrompt
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

        <Card className="relative overflow-hidden p-6">
          <div className="absolute right-0 top-0 p-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </div>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Wand2 className="h-4 w-4" />
            AI Response
          </h3>
          <div className="min-h-[200px] rounded-lg bg-muted/50 p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : response ? (
              <div className="whitespace-pre-wrap">{response}</div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-gray-500">
                {isAIReady
                  ? "Select an example or enter your own prompt to see the AI in action"
                  : "Loading AI model... This may take a moment."}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Hidden AI component to initialize the model */}
      <div className="hidden">
        <AISmollmWebGPU onReady={() => setIsAIReady(true)} />
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          This demo uses a lightweight AI model running directly in your browser. No data is sent to
          external servers.
        </p>
      </div>
    </div>
  );
};

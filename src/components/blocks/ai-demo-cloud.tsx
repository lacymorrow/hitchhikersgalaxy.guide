"use client";

import { Bot, Loader2, Send, Sparkles, Terminal, Wand2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const SYSTEM_PROMPT = {
  role: "system" as const,
  content:
    "You are a helpful AI assistant. You provide clear, accurate, and concise responses. You are direct and to the point, but maintain a friendly tone. If you're not sure about something, you say so. You do not make up information.",
};

const demoPrompts = [
  "What is the meaning of life?",
  "Write a haiku about coding",
  "Explain quantum computing",
  "Tell me a joke about AI",
] as const;

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const AIDemoCloud: React.FC = () => {
  const [prompt, setPrompt] = React.useState("");
  const [response, setResponse] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selectedDemo, setSelectedDemo] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([SYSTEM_PROMPT]);
  const [error, setError] = React.useState<string | null>(null);
  const [requestCount, setRequestCount] = React.useState(0);
  const lastRequestTime = React.useRef<number>(0);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const responseRef = React.useRef<HTMLDivElement>(null);

  // Rate limiting: 5 requests per minute
  const canMakeRequest = () => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    if (requestCount >= 5 && lastRequestTime.current > oneMinuteAgo) {
      return false;
    }

    if (lastRequestTime.current <= oneMinuteAgo) {
      setRequestCount(0);
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (!canMakeRequest()) {
      setError("Please wait a moment before making another request.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(""); // Clear previous response

    try {
      const newMessages: Message[] = [
        ...messages.slice(-4),
        { role: "user" as const, content: prompt.trim() },
      ];
      setMessages(newMessages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      let fullResponse = "";
      const decoder = new TextDecoder();

      // Set loading to false as soon as we start receiving the stream
      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        if (text.startsWith("Error:")) {
          throw new Error(text.slice(7));
        }
        fullResponse += text;
        // Update the response immediately for each chunk
        setResponse(fullResponse);
      }

      setMessages([...newMessages, { role: "assistant" as const, content: fullResponse }]);
      setRequestCount((prev) => prev + 1);
      lastRequestTime.current = Date.now();
      setPrompt(""); // Clear input after successful response
    } catch (error) {
      console.error("AI Generation error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while generating the response. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (prompt: string) => {
    setPrompt(prompt);
    setSelectedDemo(prompt);
    setError(null);
  };

  const scrollToBottom = React.useCallback((element: HTMLDivElement | null) => {
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtTop = target.scrollTop > 0;
    setIsScrolled(isAtTop);

    // Show scroll button when not at bottom (50px threshold)
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setShowScrollButton(!isNearBottom);
  }, []);

  return (
    <>
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
            <Button type="submit" disabled={loading || !prompt} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Generate Response
            </Button>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
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
          <div className="relative">
            <div
              className={`h-[200px] overflow-y-auto scroll-smooth rounded-lg bg-muted/50 p-4 ${isScrolled ? "bg-gradient-to-b from-muted/50 to-transparent" : ""}`}
              ref={(el) => {
                responseRef.current = el;
                scrollToBottom(el);
              }}
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : response ? (
                <div className="whitespace-pre-wrap">{response}</div>
              ) : (
                <div className="flex h-full items-center justify-center text-center text-gray-500">
                  Select an example or enter your own prompt to see the AI in action
                </div>
              )}
            </div>
            {showScrollButton && (
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full opacity-90 transition-opacity hover:opacity-100"
                onClick={() => scrollToBottom(responseRef.current)}
              >
                <Send className="h-4 w-4 rotate-90" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          This demo uses OpenAI's GPT-4 model to generate responses. Limited to 5 requests per
          minute.
        </p>
      </div>
    </>
  );
};

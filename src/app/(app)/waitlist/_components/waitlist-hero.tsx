"use client";

import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { addToWaitlistSimple } from "@/server/actions/waitlist-actions";

export function WaitlistHero() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");

    try {
      const result = await addToWaitlistSimple(email);

      if (result.success) {
        setStatus("success");
        setEmail("");
        toast({
          title: "Welcome aboard! 🚀",
          description: "You're now on the exclusive early access list. We'll be in touch soon!",
        });
      } else {
        console.error("Error adding to waitlist:", result.error);
        setStatus("error");
        toast({
          title: "Oops, something went wrong",
          description: result.error ?? "Mind trying again? We promise it'll work this time.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
      toast({
        title: "Oops, something went wrong",
        description: "Mind trying again? We promise it'll work this time.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800" />
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute -left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-violet-400/20 to-transparent blur-3xl"
            style={{ animationDuration: "6s" }}
          />
          <div
            className="absolute -right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-bl from-blue-400/20 to-transparent blur-3xl"
            style={{ animationDuration: "8s", animationDelay: "2s" }}
          />
        </div>
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]"
          style={{ backgroundSize: "32px 32px" }}
        />
      </div>

      <div className="container relative z-10 px-4 text-center md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Launch Badge */}
          <div className="mb-8 flex justify-center">
            <Badge
              variant="outline"
              className="border-violet-200 bg-white/90 px-4 py-2 text-sm font-medium text-violet-700 backdrop-blur-sm dark:border-violet-800 dark:bg-slate-900/90 dark:text-violet-300"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              50% OFF Early Access • March 2025
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Ship in Days
            </span>
            <span className="mt-2 block text-slate-900 dark:text-white">Not Weeks</span>
          </h1>

          {/* Value Proposition */}
          <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-slate-600 dark:text-slate-300 md:text-2xl">
            The Next.js starter that actually works.{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              Auth, payments, database, and deployment
            </span>{" "}
            — all configured and ready to ship.
          </p>

          {/* Key Benefits */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span>3-week setup → 3 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Production-ready code</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              <span>1,200+ developers waiting</span>
            </div>
          </div>

          {/* Email Signup */}
          <div className="mx-auto mb-8 max-w-md">
            <form onSubmit={handleSubmit} className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 opacity-25 blur transition duration-500 group-hover:opacity-40" />
              <div className="relative flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 flex-1 border-none bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={status === "loading" || status === "success"}
                />
                <Button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="h-12 bg-gradient-to-r from-violet-600 to-purple-600 px-6 hover:from-violet-700 hover:to-purple-700"
                >
                  {status === "loading" ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : status === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <>
                      <span className="mr-2 hidden sm:inline">Get Early Access</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Join 1,200+ developers. No spam, ever. Unsubscribe anytime.
            </p>
          </div>

          {/* Trust Signal */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span>Built by developers who&apos;ve shipped 100+ products</span>
          </div>
        </div>
      </div>
    </section>
  );
}

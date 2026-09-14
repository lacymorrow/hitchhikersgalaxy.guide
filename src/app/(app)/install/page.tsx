"use client";

import { AlertTriangleIcon, ExternalLinkIcon, TerminalIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShadcnCommand } from "./components/shadcn-command";

export default function InstallPage() {
  const [containerStatus, setContainerStatus] = useState<string>("initializing");
  const [containerProgress, setContainerProgress] = useState<number>(0);
  const [_files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [webContainerSupported, setWebContainerSupported] = useState(false);
  const [isCrossOriginIsolated, setIsCrossOriginIsolated] = useState(false);
  const [containerReady, setContainerReady] = useState(false);
  const containerInitialized = useRef(false);

  // Check if WebContainer is supported and start container initialization on load
  useEffect(() => {
    const initialize = () => {
      // Check WebContainer support
      try {
        if (typeof window !== "undefined") {
          // Check if the page is cross-origin isolated
          setIsCrossOriginIsolated(!!window.crossOriginIsolated);

          // Basic check for features needed by WebContainers
          const isSupported =
            "serviceWorker" in navigator && "SharedWorker" in window && "Atomics" in window;

          // Only mark as supported if cross-origin isolated
          const isFullySupported = isSupported && window.crossOriginIsolated;
          setWebContainerSupported(isFullySupported);

          // Start container initialization if supported
          if (isFullySupported) {
            startContainerInitialization();
          }
        }
      } catch (err) {
        console.error("Error checking WebContainer support:", err);
        setWebContainerSupported(false);
      }
    };

    initialize();
  }, []);

  // Initialize the web container in the background
  const startContainerInitialization = async () => {
    if (containerInitialized.current) return;
    containerInitialized.current = true;

    try {
      setContainerStatus("loading-container");
      setContainerProgress(20);

      // Dynamically import the container manager to avoid SSR issues
      const { ContainerManager } = await import("./container-manager");
      if (!ContainerManager) {
        throw new Error("WebContainer is only available in browser environments");
      }

      // Create and initialize the container manager
      const manager = new ContainerManager();

      setContainerStatus("initializing-container");
      setContainerProgress(50);

      // Initialize the container with selective loading
      await manager.initialize();

      setContainerStatus("loading-shadcn-files");
      setContainerProgress(80);

      // Import essential project files (package.json, tailwind.config.ts, etc.)
      await manager.importProjectFiles();

      setContainerStatus("ready");
      setContainerProgress(100);
      setContainerReady(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setContainerStatus("error");
    }
  };

  const handleCommandExecuted = (processedFiles: { path: string; content: string }[]) => {
    setFiles(processedFiles);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-background/80">
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-[0.03]" />

      <div className="container relative mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="mb-4 flex items-center justify-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TerminalIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-3xl font-bold text-transparent">
              Install shadcn/ui
            </h1>
          </div>
          <p className="mx-auto max-w-md text-center text-muted-foreground">
            Add beautiful, accessible UI components to your Next.js application with one command
          </p>
        </div>

        {/* Alerts */}
        <div className="mb-8 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!webContainerSupported && (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertTitle>WebContainer Not Supported</AlertTitle>
              <AlertDescription>
                {isCrossOriginIsolated
                  ? "Your browser doesn't support the features needed for WebContainers."
                  : "Cross-Origin Isolation is not enabled. WebContainers require a cross-origin isolated environment."}{" "}
                Please use the manual installation method instead.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
          {/* Container Loading Indicator */}
          {webContainerSupported && containerStatus !== "ready" && containerStatus !== "error" && (
            <div className="border-b bg-muted/50 p-4">
              <div className="space-y-2">
                <p className="flex items-center text-sm font-medium">
                  <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  {containerStatus === "initializing" && "Setting up environment..."}
                  {containerStatus === "loading-container" && "Loading WebContainer..."}
                  {containerStatus === "initializing-container" && "Initializing container..."}
                  {containerStatus === "loading-shadcn-files" && "Loading essential files..."}
                  <span className="ml-2 text-xs text-muted-foreground">
                    (You can enter your command while this loads)
                  </span>
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${containerProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Command Box */}
          <div className="p-6">
            <ShadcnCommand
              containerReady={containerReady}
              webContainerSupported={webContainerSupported}
              onExecute={handleCommandExecuted}
              autoRun={false}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-muted/20 p-4">
            <div className="text-xs text-muted-foreground">
              {containerStatus === "ready" ? (
                <span className="flex items-center text-emerald-500">
                  <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  WebContainer Ready
                </span>
              ) : (
                <span>Setting up environment...</span>
              )}
            </div>
            <a
              href="https://ui.shadcn.com/docs/installation"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-primary transition-colors hover:text-primary/80"
            >
              Prefer to install manually? <ExternalLinkIcon className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-medium">Pre-configured</h3>
            <p className="text-xs text-muted-foreground">
              Each component comes with accessibility features and flexible styling options.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-medium">Tailwind Powered</h3>
            <p className="text-xs text-muted-foreground">
              Built with Tailwind CSS, fully customizable to match your design system.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-medium">Code Ownership</h3>
            <p className="text-xs text-muted-foreground">
              Components are added to your project, giving you full control of the code.
            </p>
          </div>
        </div>
      </div>

      {/* Add a CSS class for the grid pattern */}
      {/* eslint-disable-next-line react/no-unknown-property -- styled-jsx attributes */}
      <style jsx global>{`
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(127, 127, 127, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(127, 127, 127, 0.1) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
}

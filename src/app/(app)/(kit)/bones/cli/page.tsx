import { ArrowRight, Cloud, Code, Download, RefreshCw, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CliPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">ShipKit CLI</h1>
        <p className="text-xl text-muted-foreground">
          Create, sync, and deploy ShipKit projects from your terminal
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Quick Start
          </CardTitle>
          <CardDescription>One command to scaffold a new project</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>npx create-shipkit@latest my-app</code>
          </pre>
        </CardContent>
      </Card>

      {/* Commands */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              create
            </CardTitle>
            <CardDescription>Scaffold a new ShipKit project from a template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
              <code>shipkit create my-app</code>
            </pre>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <code className="rounded bg-muted px-1 text-xs">-t, --template</code> Template repo
                (owner/name)
              </p>
              <p>
                <code className="rounded bg-muted px-1 text-xs">-d, --directory</code> Target
                directory
              </p>
              <p>
                <code className="rounded bg-muted px-1 text-xs">-y, --yes</code> Skip prompts
              </p>
              <p>
                <code className="rounded bg-muted px-1 text-xs">--no-install</code> Skip installing
                dependencies
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              sync
            </CardTitle>
            <CardDescription>Pull upstream changes from the ShipKit template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
              <code>shipkit sync</code>
            </pre>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <code className="rounded bg-muted px-1 text-xs">--direct</code> Merge directly
                instead of a PR branch
              </p>
              <p>
                <code className="rounded bg-muted px-1 text-xs">-y, --yes</code> Skip prompts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              deploy
            </CardTitle>
            <CardDescription>Deploy your ShipKit site to Vercel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
              <code>shipkit deploy</code>
            </pre>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <code className="rounded bg-muted px-1 text-xs">--open</code> Open the Vercel import
                page in your browser
              </p>
              <p>
                <code className="rounded bg-muted px-1 text-xs">-y, --yes</code> Skip prompts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Workflow
          </CardTitle>
          <CardDescription>The full lifecycle of a ShipKit project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                1
              </div>
              <div>
                <p className="font-medium">Create</p>
                <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-sm">
                  <code>npx create-shipkit@latest my-app</code>
                </pre>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                2
              </div>
              <div>
                <p className="font-medium">Develop</p>
                <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-sm">
                  <code>cd my-app && npm run dev</code>
                </pre>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                3
              </div>
              <div>
                <p className="font-medium">Sync</p>
                <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-sm">
                  <code>shipkit sync</code>
                </pre>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep your project up to date with the latest ShipKit features
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                4
              </div>
              <div>
                <p className="font-medium">Deploy</p>
                <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-sm">
                  <code>shipkit deploy</code>
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Options */}
      <Card>
        <CardHeader>
          <CardTitle>Installation</CardTitle>
          <CardDescription>
            Install globally if you prefer, or use npx for zero-install
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">npx (recommended)</h3>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
              <code>npx create-shipkit@latest my-app</code>
            </pre>
          </div>
          <div>
            <h3 className="mb-2 font-medium">npm</h3>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
              <code>npm install -g create-shipkit</code>
            </pre>
          </div>
          <div>
            <h3 className="mb-2 font-medium">pnpm</h3>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-sm">
              <code>pnpm add -g create-shipkit</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

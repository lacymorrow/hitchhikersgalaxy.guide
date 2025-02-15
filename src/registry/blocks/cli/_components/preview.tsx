"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type RegistryItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PreviewProps {
  item: RegistryItem;
  className?: string;
}

interface IframeSandbox {
  html: string;
  css: string;
  js: string;
}

function extractCode(files: RegistryItem["files"]): IframeSandbox {
  const sandbox: IframeSandbox = {
    html: "",
    css: "",
    js: "",
  };

  files.forEach((file) => {
    if (!file.content) return;

    if (file.path.endsWith(".tsx") || file.path.endsWith(".jsx")) {
      // Extract JSX/TSX content
      const jsxContent = file.content
        // Remove all import statements
        .replace(/import\s+[^;]+;?\s*/g, "")
        // Remove export statements but keep the content
        .replace(/export\s+default\s+/, "")
        .replace(/export\s+/, "")
        // Remove type annotations
        .replace(/:\s*[A-Za-z<>[\]{}|&]+/g, "")
        .replace(/React\./g, "");

      // Convert JSX to JS (basic conversion for preview)
      sandbox.js += `
        try {
          // Wrap in IIFE to avoid scope issues
          (function() {
            console.log('Executing component code');

            // Setup React globals
            const React = window.React;
            const ReactDOM = window.ReactDOM;
            const useState = React.useState;
            const useEffect = React.useEffect;
            const useRef = React.useRef;

            // Define component
            ${jsxContent}

            // Get the component name from the file name
            const componentName = '${file.path
              .split("/")
              .pop()
              ?.replace(/\.[jt]sx$/, "")}';
            console.log('Component name:', componentName);

            // Try to find the component function
            let Component =
              // Try function declaration
              (typeof ${
                jsxContent.match(/function\s+(\w+)/)?.[1] || "null"
              } === 'function'
                ? ${jsxContent.match(/function\s+(\w+)/)?.[1]}
              // Try const/let/var declaration
              : typeof ${
                jsxContent.match(/(?:const|let|var)\s+(\w+)\s*=/)?.[1] || "null"
              } === 'function'
                ? ${jsxContent.match(/(?:const|let|var)\s+(\w+)\s*=/)?.[1]}
              // Try file name
              : typeof ${file.path
                .split("/")
                .pop()
                ?.replace(/\.[jt]sx$/, "")} === 'function'
                ? ${file.path
                  .split("/")
                  .pop()
                  ?.replace(/\.[jt]sx$/, "")}
              : null);

            console.log('Found component:', Component ? 'yes' : 'no');

            if (Component) {
              const root = document.getElementById('root');
              // Use ReactDOM for proper React rendering
              ReactDOM.render(React.createElement(Component), root);
              console.log('Component rendered');
            } else {
              console.error('Could not find component function');
              document.getElementById('root').innerHTML = '<div class="error">Could not find component function</div>';
            }
          })();
        } catch (err) {
          console.error('Error in component:', err);
          document.getElementById('root').innerHTML = \`
            <div class="error">
              <strong>Error in component:</strong><br>
              \${err.message}
            </div>
          \`;
        }
      `;
    } else if (file.path.endsWith(".css")) {
      sandbox.css += file.content;
    }
  });

  return sandbox;
}

function createPreviewUrl(item: RegistryItem): string {
  const sandbox = extractCode(item.files);

  // Add polyfills and dependencies
  const dependencies = {
    react: "https://unpkg.com/react@18/umd/react.development.js",
    "react-dom": "https://unpkg.com/react-dom@18/umd/react-dom.development.js",
    motion: "https://unpkg.com/@motionone/dom@10.16.2/dist/motion.min.js",
    tailwindcss: "https://cdn.tailwindcss.com",
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Component Preview</title>

        <!-- Dependencies -->
        ${Object.entries(dependencies)
          .filter(([dep]) => !item.dependencies?.some((d) => d.startsWith(dep)))
          .map(([, url]) => `<script src="${url}"></script>`)
          .join("\n")}

        <!-- Tailwind -->
        <script>
          window.tailwind = window.tailwind || {};
          window.tailwind.config = {
            theme: {
              extend: ${JSON.stringify(
                item?.tailwind?.config?.theme?.extend || {}
              )}
            }
          }
        </script>

        <style>
          ${sandbox.css}
          /* Add default styles */
          body {
            margin: 0;
            padding: 1rem;
            font-family: system-ui, sans-serif;
          }
          #root {
            min-height: 100px;
            background: #fff;
          }
          .error {
            color: #ef4444;
            padding: 1rem;
            border: 1px solid #ef4444;
            border-radius: 0.5rem;
            margin: 1rem;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          // Add error boundary
          window.onerror = function(msg, url, line, col, error) {
            console.error('Error:', msg, url, line, col, error);
            document.getElementById('root').innerHTML = \`
              <div class="error">
                <strong>Error:</strong> \${msg}<br>
                <small>Line \${line}, Column \${col}</small>
              </div>
            \`;
            return false;
          };

          try {
            // Log for debugging
            console.log('Running preview script');

            ${sandbox.js}

            console.log('Preview script completed');
          } catch (err) {
            console.error('Error in preview script:', err);
            document.getElementById('root').innerHTML = \`
              <div class="error">
                <strong>Error:</strong> \${err.message}
              </div>
            \`;
          }
        </script>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

export function Preview({ item, className }: PreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const url = createPreviewUrl(item);
      setPreviewUrl(url);
      setLoading(false);
      setError(null);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create preview");
      setLoading(false);
    }
  }, [item]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Tabs defaultValue="preview">
        <div className="border-b p-4">
          <TabsList className="h-12">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="responsive">Responsive</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="p-4">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-[400px] items-center justify-center text-destructive">
              {error}
            </div>
          ) : (
            <div className="rounded-lg border">
              <iframe
                src={previewUrl}
                className="h-[400px] w-full"
                sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
                title="Component Preview"
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="responsive" className="p-4">
          <div className="space-y-4">
            {/* Mobile */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Mobile</h4>
              <div className="rounded-lg border">
                <iframe
                  src={previewUrl}
                  className="h-[400px] w-[375px]"
                  sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
                  title="Mobile Preview"
                />
              </div>
            </div>
            {/* Tablet */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Tablet</h4>
              <div className="rounded-lg border">
                <iframe
                  src={previewUrl}
                  className="h-[400px] w-[768px]"
                  sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
                  title="Tablet Preview"
                />
              </div>
            </div>
            {/* Desktop */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Desktop</h4>
              <div className="rounded-lg border">
                <iframe
                  src={previewUrl}
                  className="h-[400px] w-full"
                  sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
                  title="Desktop Preview"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

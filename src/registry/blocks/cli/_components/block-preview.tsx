"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type RegistryItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface BlockPreviewProps {
  block: RegistryItem;
  className?: string;
}

interface BlockConfig {
  name: string;
  description?: string;
  dependencies?: string[];
  props?: Record<string, any>;
  layout?: {
    header?: boolean;
    footer?: boolean;
    sidebar?: boolean;
  };
}

function loadBlockConfig(files: RegistryItem["files"]): BlockConfig | null {
  const configFile = files.find((f) => f.path.endsWith("block.config.json"));
  if (!configFile?.content) return null;

  try {
    return JSON.parse(configFile.content);
  } catch {
    return null;
  }
}

function createBlockPreview(
  block: RegistryItem,
  config: BlockConfig | null
): string {
  const mainFile = block.files.find(
    (f) =>
      f.path.endsWith("page.tsx") ||
      f.path.endsWith("index.tsx") ||
      f.path.endsWith(".tsx")
  );

  if (!mainFile?.content) {
    throw new Error("No main file found");
  }

  // Extract styles
  const styles = block.files
    .filter((f) => f.path.endsWith(".css"))
    .map((f) => f.content || "")
    .join("\n");

  // Create HTML with layout
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${block.name} Preview</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          ${styles}
          /* Layout styles */
          .layout {
            display: grid;
            min-height: 100vh;
            grid-template-areas:
              ${config?.layout?.header ? '"header header header"' : ""}
              ${
                config?.layout?.sidebar
                  ? '"sidebar main main"'
                  : '"main main main"'
              }
              ${config?.layout?.footer ? '"footer footer footer"' : ""};
            grid-template-rows: ${config?.layout?.header ? "auto" : ""} 1fr ${
    config?.layout?.footer ? "auto" : ""
  };
            grid-template-columns: ${
              config?.layout?.sidebar ? "250px" : ""
            } 1fr 1fr;
          }
          .header { grid-area: header; }
          .sidebar { grid-area: sidebar; }
          .main { grid-area: main; }
          .footer { grid-area: footer; }
        </style>
      </head>
      <body>
        <div class="layout">
          ${
            config?.layout?.header
              ? '<header class="header bg-gray-100 p-4">Header</header>'
              : ""
          }
          ${
            config?.layout?.sidebar
              ? '<aside class="sidebar bg-gray-50 p-4">Sidebar</aside>'
              : ""
          }
          <main class="main p-4">
            <div id="root"></div>
          </main>
          ${
            config?.layout?.footer
              ? '<footer class="footer bg-gray-100 p-4">Footer</footer>'
              : ""
          }
        </div>
        <script type="module">
          ${
            mainFile.content
              .replace(/import[^;]+;/g, "") // Remove imports
              .replace("export default", "window.BlockComponent =") // Export component
          }
          const root = document.getElementById('root');
          const props = ${JSON.stringify(config?.props || {})};
          if (typeof BlockComponent === 'function') {
            root.innerHTML = BlockComponent(props);
          }
        </script>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  return URL.createObjectURL(blob);
}

export function BlockPreview({ block, className }: BlockPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<BlockConfig | null>(null);

  useEffect(() => {
    try {
      const blockConfig = loadBlockConfig(block.files);
      setConfig(blockConfig);
      const url = createBlockPreview(block, blockConfig);
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
  }, [block]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Tabs defaultValue="desktop">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
            <TabsTrigger value="tablet">Tablet</TabsTrigger>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="desktop" className="border-none p-0">
          {loading ? (
            <div className="flex h-[600px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-[600px] items-center justify-center text-destructive">
              {error}
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="h-[600px] w-full"
              sandbox="allow-scripts"
              title="Desktop Preview"
            />
          )}
        </TabsContent>
        <TabsContent value="tablet" className="border-none p-0">
          <div className="flex justify-center p-4">
            <iframe
              src={previewUrl}
              className="h-[800px] w-[768px]"
              sandbox="allow-scripts"
              title="Tablet Preview"
            />
          </div>
        </TabsContent>
        <TabsContent value="mobile" className="border-none p-0">
          <div className="flex justify-center p-4">
            <iframe
              src={previewUrl}
              className="h-[800px] w-[375px]"
              sandbox="allow-scripts"
              title="Mobile Preview"
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

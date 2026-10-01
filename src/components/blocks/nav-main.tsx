"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowLeftFromLineIcon, FlaskConical, Folder, LayoutDashboard, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { env } from "@/env";
import { cn } from "@/lib/utils";

const data = [
  {
    title: "Dashboard",
    url: routes.app.dashboard,
    icon: LayoutDashboard,
    iconName: "dashboard",
  },
  // {
  // 	title: `Download ${siteConfig.title}`,
  // 	url: routes.download,
  // 	icon: Download,
  // },
  {
    title: "Management",
    icon: Folder,
    iconName: "folder",
    items: [
      { title: "Projects", url: routes.app.projects },
      { title: "Teams", url: routes.app.teams },
      { title: "Deployments", url: routes.app.deployments },
      { title: "API Keys", url: routes.app.apiKeys },
    ],
  },
  {
    title: "Demos",
    icon: FlaskConical,
    iconName: "flask",
    items: [
      { title: "UI Demo", url: routes.examples.index },
      ...(env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED
        ? [{ title: "Builder.io", url: routes.demo.builderio }]
        : []),
      ...(env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED
        ? [{ title: "Payload CMS", url: routes.demo.payloadCms }]
        : []),
      ...(env.NEXT_PUBLIC_FEATURE_MDX_ENABLED
        ? [{ title: "Markdown Content", url: routes.pages.markdown }]
        : []),
      { title: "Pages Router", url: routes.pages.index },
      { title: "TRPC Example", url: routes.demo.trpc },

      // {
      // 	title: "AI",
      // 	items: [
      // 		// Core AI Features
      // 		{ title: "Code Completion", url: routes.ai.codeCompletion },
      // 		{ title: "Spam Detection", url: routes.ai.spam },
      // 		{ title: "Cross-Encoder", url: routes.ai.crossEncoder },
      // 		{ title: "Report Generation", url: routes.ai.reportGen },
      // 		{ title: "Zero-Shot Classification", url: routes.ai.zeroShotClassification },

      // 		// Language Models
      // 		{ title: "Llama 3.2", url: routes.ai.llama32Webgpu },
      // 		{ title: "Llama 3.2 Reasoning", url: routes.ai.llama32ReasoningWebgpu },
      // 		{ title: "Phi 3.5", url: routes.ai.phi35Webgpu },
      // 		{ title: "Gemma 2 2B", url: routes.ai.gemma22bJpnWebgpu },
      // 		{ title: "DeepSeek", url: routes.ai.deepseekWeb },
      // 		{ title: "SmolLM", url: routes.ai.smollmWeb },
      // 		{ title: "SmolVM", url: routes.ai.smolvmWeb },

      // 		// Speech & Audio
      // 		{ title: "Whisper", url: routes.ai.whisper },
      // 		{ title: "Whisper Timestamped", url: routes.ai.whisperTimestamped },
      // 		{ title: "SpeechT5", url: routes.ai.speecht5Web },
      // 		{ title: "Text to Speech", url: routes.ai.textToSpeechWebgpu },
      // 		{ title: "MusicGen", url: routes.ai.musicgenWeb },

      // 		// Vision & Image
      // 		{ title: "Video Object Detection", url: routes.ai.videoObjectDetection },
      // 		{ title: "Video Background Removal", url: routes.ai.videoBackgroundRemoval },
      // 		{ title: "Remove Background", url: routes.ai.removeBackground },
      // 		{ title: "Remove Background (Web)", url: routes.ai.removeBackgroundWeb },
      // 		{ title: "WebGPU CLIP", url: routes.ai.webgpuClip },
      // 		{ title: "Florence2", url: routes.ai.florence2Web },

      // 		// Embeddings & Search
      // 		{ title: "Semantic Search", url: routes.ai.semanticSearch },
      // 		{ title: "Semantic Image Search", url: routes.ai.semanticImageSearchWeb },
      // 		{ title: "WebGPU Nomic Embed", url: routes.ai.webgpuNomicEmbed },
      // 		{ title: "WebGPU Embedding Benchmark", url: routes.ai.webgpuEmbeddingBenchmark },

      // 		// Other AI Tools
      // 		{ title: "Type Ahead", url: routes.ai.typeAhead },
      // 		{ title: "Janus", url: routes.ai.janusWebgpu },
      // 		{ title: "Janus Pro", url: routes.ai.janusProWebgpu },
      // 		{ title: "Moonshine Web", url: routes.ai.moonshineWeb },
      // 	],
      // },
    ],
  },
  {
    title: "Tools",
    url: routes.app.tools,
    icon: Wrench,
    iconName: "wrench",
  },
];

/**
 * The selected row's background is one element shared by every row. framer-motion's
 * layoutId makes it spring from the old row to the new one instead of blinking.
 */
const ActivePill = () => (
  <motion.span
    layoutId="sidebar-active-pill"
    aria-hidden
    className="absolute inset-0 -z-10 rounded-md bg-sidebar-accent"
    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
  />
);

// Helper function to determine if a route is active
const isRouteActive = (currentPath: string, itemPath: string) => {
  if (itemPath === "#") return false;
  return currentPath.startsWith(itemPath);
};

type NavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
  /** Picks the icon's hover move in sidebar-icons.css. */
  iconName?: string;
  isActive?: boolean;
  items?: (NavItem | { title: string; url: string })[];
};

export function NavMain({ items = data }: { items?: NavItem[] }) {
  const pathname = usePathname();

  // Recursive function to render menu items
  const renderMenuItem = (item: NavItem | { title: string; url: string }) => {
    if (!pathname) return null;
    const isActive = "url" in item && item.url ? isRouteActive(pathname, item.url) : false;
    const hasActiveChild =
      "items" in item &&
      item.items?.some((subItem) =>
        "url" in subItem && subItem.url ? isRouteActive(pathname, subItem.url) : false
      );

    if (!("items" in item)) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            data-active={isActive}
            className="relative isolate active:scale-[0.98] data-[active=true]:bg-transparent data-[active=true]:hover:bg-transparent"
          >
            <Link href={item?.url ?? "#"} className="w-full max-w-full" data-icon-host>
              {isActive && <ActivePill />}
              {"icon" in item && item.icon && (
                <item.icon
                  data-icon={"iconName" in item ? item.iconName : undefined}
                  className={cn(
                    "shrink-0 text-muted-foreground transition-colors",
                    "group-hover:text-foreground",
                    isActive && "text-foreground"
                  )}
                />
              )}
              <span
                className={cn(
                  "truncate text-muted-foreground transition-colors",
                  "group-hover:text-foreground",
                  isActive && "font-medium text-foreground"
                )}
              >
                {item.title}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    return (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={isActive || hasActiveChild}
        className="group/collapsible"
      >
        <SidebarMenuItem className="p-0">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              data-active={isActive || hasActiveChild}
              asChild
              className="relative isolate active:scale-[0.98] data-[active=true]:bg-transparent data-[active=true]:hover:bg-transparent"
            >
              <Link href={item?.url ?? "#"} className="w-full max-w-full" data-icon-host>
                {isActive && !hasActiveChild && <ActivePill />}
                {item.icon && (
                  <item.icon
                    data-icon={item.iconName}
                    className={cn(
                      "shrink-0 text-muted-foreground transition-colors",
                      "group-hover:text-foreground",
                      (isActive || hasActiveChild) && "text-foreground"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "truncate text-muted-foreground transition-colors",
                    "group-hover:text-foreground",
                    (isActive || hasActiveChild) && "font-medium text-foreground"
                  )}
                >
                  {item.title}
                </span>
                <div className="ml-auto shrink-0 rounded-md p-1 hover:bg-muted-foreground/20">
                  <ChevronRightIcon className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </div>
              </Link>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="mr-0 max-w-full pr-0">
              {item.items?.map((subItem) => renderMenuItem(subItem))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  };

  return (
    <>
      <SidebarGroup
        className={cn(
          "relative max-w-full pl-0",
          "opacity-50 transition-opacity hover:opacity-100"
        )}
      >
        <SidebarGroupLabel className="p-0">
          <Link
            href={routes.home}
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "flex w-full max-w-full items-center justify-start gap-2"
            )}
          >
            <ArrowLeftFromLineIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{siteConfig.title} Home</span>
          </Link>
        </SidebarGroupLabel>
      </SidebarGroup>

      <SidebarGroup className="max-w-full">
        <SidebarGroupLabel className="sr-only">Navigation</SidebarGroupLabel>
        <SidebarMenu className="max-w-full">
          {items.map((item) => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

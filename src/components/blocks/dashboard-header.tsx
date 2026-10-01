import { ChevronRight } from "lucide-react";
import { DashboardHeaderHomeLink } from "@/components/blocks/dashboard-header-home-link";
import { ProjectSwitcher } from "@/components/blocks/project-switcher";
import { ScrollEdgeHeader } from "@/components/blocks/scroll-edge-header";
import { TeamSwitcher } from "@/components/blocks/team-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const DashboardHeader = () => {
  return (
    <ScrollEdgeHeader className="fixed top-0 z-30 w-full">
      <div className="flex h-11 items-center gap-2 px-4">
        {/* Keep a sidebar trigger on mobile so the off-canvas sidebar is still accessible. */}
        <SidebarTrigger className="-ml-1 md:hidden" />

        <div className="flex min-w-0 items-center gap-1.5">
          <div className="truncate text-sm font-semibold">
            <DashboardHeaderHomeLink />
          </div>

          {/* Breadcrumb: workspace, then project. */}
          <div className="hidden items-center gap-1.5 md:flex">
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
            <TeamSwitcher variant="header" />
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
            <ProjectSwitcher />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-2 md:hidden">
        <TeamSwitcher variant="header" />
        <ProjectSwitcher />
      </div>
    </ScrollEdgeHeader>
  );
};

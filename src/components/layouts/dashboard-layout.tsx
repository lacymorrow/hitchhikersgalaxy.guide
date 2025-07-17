import { SidebarCloseIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/blocks/app-sidebar";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";

export const DashboardLayout = async ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <SidebarLayout>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1">
              <SidebarCloseIcon />
            </SidebarTrigger>
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbNav
              homeLabel={`${siteConfig.name} Dashboard`}
              pathLabels={{
                [routes.app.dashboard]: "Dashboard",
                [routes.app.deploy]: "Deploy",
                [routes.app.apiKeys]: "API Keys",
                [routes.settings.index]: "Settings",
                [routes.app.tools]: "Tools",
              }}
            />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarLayout>
  );
};

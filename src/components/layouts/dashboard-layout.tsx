import { type ReactNode, Suspense } from "react";
import { DashboardFooter } from "@/components/blocks/dashboard-footer";
import { DashboardHeader } from "@/components/blocks/dashboard-header";
import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { AppSidebar } from "@/components/modules/sidebar/app-sidebar";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { SidebarInset } from "@/components/ui/sidebar";

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarLayout>
      <div
        // The app shell sets its own type scale: 13/20 with tabular figures, like a native toolbar.
        className="flex min-h-svh w-full flex-col text-[13px] tabular-nums leading-5"
        style={
          {
            "--header-height": "2.75rem",
            "--sidebar-top": "var(--header-height)",
          } as React.CSSProperties
        }
      >
        <DashboardHeader />

        <div className="flex flex-1 pt-24 md:pt-[--header-height]">
          <AppSidebar />
          <SidebarInset>
            <div className="flex flex-1 flex-col">
              <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
            </div>
            <DashboardFooter />
          </SidebarInset>
        </div>
      </div>
    </SidebarLayout>
  );
};

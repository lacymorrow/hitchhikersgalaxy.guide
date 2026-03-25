import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { constructMetadata } from "@/config/metadata";
import { routes } from "@/config/routes";

export const metadata: Metadata = constructMetadata({
  title: "Demo",
  description: "Explore component demos and examples showcasing various UI patterns and features.",
  noIndex: true,
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-grid border-b">
        <div className="container-wrapper">
          <div className="container flex items-center gap-4 py-3">
            <Link
              href={routes.app.dashboard}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}

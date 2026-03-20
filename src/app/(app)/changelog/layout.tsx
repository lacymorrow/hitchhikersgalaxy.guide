import type { ReactNode } from "react";
import { Footer } from "@/components/footers/extended-footer";
import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout
      header={<Header searchVariant="ai" variant="floating" opaqueOnScroll={0} />}
      footer={<Footer />}
    >
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </MainLayout>
  );
}

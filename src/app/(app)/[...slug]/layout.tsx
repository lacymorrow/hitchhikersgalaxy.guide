import { Header } from "@/components/headers/header";
import { Footer } from "@/components/footers/footer";
import { siteConfig } from "@/config/site";
import type { ReactNode } from "react";

interface DynamicLayoutProps {
    children: ReactNode;
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header logoText={siteConfig.name} />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}

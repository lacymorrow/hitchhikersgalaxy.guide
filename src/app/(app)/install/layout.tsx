import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "v0 Component Installer - Shipkit",
	description: "Install v0.dev components into your Shipkit project",
};

export default function InstallLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<main className="flex-1">{children}</main>
		</div>
	);
}

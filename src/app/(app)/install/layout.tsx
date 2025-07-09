import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "v0 Component Installer - ShipKit",
	description: "Install v0.dev components into your ShipKit project",
};

export default function InstallLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<main className="flex-1">{children}</main>
		</div>
	);
}

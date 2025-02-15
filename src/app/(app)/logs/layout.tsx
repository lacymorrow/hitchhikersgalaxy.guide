import "@/styles/globals.css";
import type React from "react";

export default function Layout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return <>{children}</>;
}

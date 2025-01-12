import { RootLayout } from "@/components/layouts/root-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
	return <RootLayout>{children}</RootLayout>;
}

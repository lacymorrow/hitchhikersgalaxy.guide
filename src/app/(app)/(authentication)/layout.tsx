import { Footer } from "@/components/footers/footer";
import { Header } from "@/components/headers/header";
import MainLayout from "@/components/layouts/main-layout";
import { Section } from "@/components/primitives/section";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<MainLayout
				className="min-h-screen flex flex-col"
				footer={false}
				header={<Header variant="logo-only" />}
			>
				<Section className="grow">{children}</Section>
			</MainLayout>
			<Footer />
		</>
	);
}

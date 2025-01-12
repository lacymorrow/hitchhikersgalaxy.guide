import { Suspense } from "react";
import { RegistryBrowser } from "./_components/registry-browser";

export default function Home() {

	return (
		<main className="container py-6">
			<div className="space-y-4">
				<div>
					<h1 className="text-3xl font-bold">Shipkit UI Browser</h1>
					<p className="text-muted-foreground">
						Browse and install components and blocks from various registries
					</p>
				</div>
				<Suspense fallback={<div>Loading...</div>}>
					<RegistryBrowser defaultRegistry="shadcn/ui" />
				</Suspense>
			</div>
		</main>
	);
}

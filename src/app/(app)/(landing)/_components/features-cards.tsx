import { Section, SectionHeader } from "@/components/primitives/section";
import { getPayloadContent } from "@/lib/utils/get-payload-content";
import type { Feature } from "@/payload-types";
import { GradientCards } from "./gradient-cards";

type StaticFeature = {
	name: string;
	description: string;
	category: string;
	order?: number;
};

export const FeaturesCards = async () => {
	let features: (Feature | StaticFeature)[] = [];

	// Get features from payload, fallback to static content
	try {
		features = await getPayloadContent<"features", StaticFeature[]>({
			collection: "features",
			options: { sort: "order" },
			fallbackImport: () => import("@/content/features/features-content"),
		});
	} catch (error) {
		console.error("Error loading features:", error);
		return null;
	}

	// Get features from important categories
	const importantFeatures = features
		// .filter(
		// 	(feature) => ["core", "security", "advanced"].includes(feature.category)
		// )
		.sort((a, b) => (a.order || 0) - (b.order || 0));

	if (!importantFeatures.length) {
		return null;
	}

	const cards = importantFeatures.map((feature) => ({
		title: feature.name,
		description: feature.description,
	}));

	return (
		<Section variant="default" size="full">
			<SectionHeader className="text-center">Why Choose ShipKit?</SectionHeader>
			<GradientCards cards={cards} className="mx-auto" />
		</Section>
	);
};

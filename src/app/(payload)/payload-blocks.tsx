import type { ContentBlock, FeaturesBlock, HeroBlock, PageBlock, TestimonialsBlock } from "@/types/blocks";
import { v4 as uuidv4 } from "uuid";
import { Content } from "./content";
import { Features } from "./features";
import { Hero } from "./hero";
import { Testimonials } from "./testimonials";

interface BlockRendererProps {
	blocks: PageBlock[];
	className?: string;
}

const renderBlock = (block: PageBlock) => {
	switch (block.blockType) {
		case "hero":
			return <Hero key={uuidv4()} block={block as HeroBlock} />;
		case "content":
			return <Content key={uuidv4()} block={block as ContentBlock} />;
		case "features":
			return <Features key={uuidv4()} block={block as FeaturesBlock} />;
		case "testimonials":
			return <Testimonials key={uuidv4()} block={block as TestimonialsBlock} />;
		default:
			return null;
	}
};

export const BlockRenderer = ({ blocks, className }: BlockRendererProps) => {
	return (
		<div className={className}>
			{blocks.map(renderBlock)}
		</div>
	);
};

export { Content } from "./content";
export { Features } from "./features";
export { Hero } from "./hero";
export { Testimonials } from "./testimonials";


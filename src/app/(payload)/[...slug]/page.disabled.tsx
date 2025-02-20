import { getPayloadClient } from "@/lib/payload/payload";
import type { Media } from "@/payload-types";
import type { PageBlock } from "@/types/blocks";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "../payload-blocks";

interface PageProps {
	params: {
		slug: string;
	};
	searchParams: {
		preview?: string;
	};
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const payload = await getPayloadClient();
	const page = await payload?.find({
		collection: "pages",
		where: {
			slug: {
				equals: params.slug,
			},
		},
	});

	if (!page?.docs[0]) {
		return {};
	}

	const { meta } = page.docs[0];

	const isMedia = (image: any): image is Media => {
		return image && typeof image === 'object' && 'url' in image;
	};

	return {
		title: meta?.title,
		description: meta?.description,
		openGraph: meta?.image && isMedia(meta.image) && meta.image.url
			? {
				images: [{
					url: meta.image.url,
					width: 1200,
					height: 630
				}],
			}
			: undefined,
	};
}

export default async function Page({ params, searchParams }: PageProps) {
	const payload = await getPayloadClient();
	const isPreview = searchParams.preview === "true";

	const pageQuery = await payload?.find({
		collection: "pages",
		where: {
			slug: {
				equals: params.slug,
			},
			...(isPreview
				? {}
				: {
					publishedAt: {
						exists: true,
					},
				}),
		},
		depth: 2,
	});

	const page = pageQuery?.docs[0];

	if (!page) {
		notFound();
	}

	return (
		<main>
			<BlockRenderer blocks={(page?.layout as PageBlock[]) ?? []} />
		</main>
	);
}

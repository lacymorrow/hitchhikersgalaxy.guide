// Example file structure, app/[...page]/page.tsx
// You could alternatively use src/app/[...page]/page.tsx
import { builder } from "@builder.io/sdk";
import { env } from "@/env";
import { RenderBuilderContent } from "./builder-io";
import "@/styles/builder-io.css";

// Revalidate this page every 60 seconds
export const revalidate = 60;

interface PageProps {
	params: Promise<{
		slug: string[];
	}>;
}

if (env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED && env.NEXT_PUBLIC_BUILDER_API_KEY) {
	builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY);
}

export default async function Page(props: PageProps) {
	if (!builder || !env.NEXT_PUBLIC_FEATURE_BUILDER_ENABLED || !env.NEXT_PUBLIC_BUILDER_API_KEY) {
		return <div>Builder is not initialized</div>;
	}

	const model = "page";
	const content = await builder
		// Get the page content from Builder with the specified options
		.get("page", {
			userAttributes: {
				// Use the page path specified in the URL to fetch the content
				urlPath: `/${(await props?.params)?.slug?.join("/")}`,
			},
			// Set prerender to false to return JSON instead of HTML
			prerender: false,
		})
		// Convert the result to a promise
		.toPromise();

	return (
		<>
			<div className="mx-auto w-full py-header">
				{/* Render the Builder page */}
				<RenderBuilderContent content={content} model={model} />
			</div>
		</>
	);
}

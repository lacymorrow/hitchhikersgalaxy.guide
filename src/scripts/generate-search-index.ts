import { getAllDocs } from "@/lib/docs";
import { writeFileSync } from "fs";
import { join } from "path";

async function generateSearchIndex() {
	const docs = await getAllDocs();

	const searchIndex = docs?.map((doc) => ({
		title: doc.title,
		description: doc.description,
		keywords: doc.keywords || [],
		slug: doc.slug,
		section: doc.section,
		content: doc.content,
	}));

	writeFileSync(
		join(process.cwd(), "public", "search-index.json"),
		JSON.stringify(searchIndex, null, 2),
	);

	console.info("Search index generated successfully!");
}

generateSearchIndex().catch(console.error);

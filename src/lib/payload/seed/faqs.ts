import { content } from "@/content/faq/faq-content";
import type { Faq } from "@/payload-types";
import { payload } from "../payload";

// Helper function to create rich text content
const createRichText = (text: string) => ({
	root: {
		type: "root" as const,
		children: [
			{
				type: "paragraph" as const,
				children: [
					{
						text,
						type: "text" as const,
					},
				],
				version: 1,
			},
		],
		direction: "ltr" as const,
		format: "left" as const,
		indent: 0,
		version: 1,
	},
});

export const seedFAQs = async () => {
	try {
		// Clear existing data
		await payload?.delete({
			collection: "faqs",
			where: {
				id: {
					exists: true,
				},
			},
		});

		const faqs = content.map((faq, index) => ({
			question: faq.question,
			answer: createRichText(faq.answer),
			category: faq.category as Faq["category"],
			order: index + 1,
		}));

		const createdFAQs = await Promise.all(
			faqs.map(async (faq) => {
				try {
					const created = await payload?.create({
						collection: "faqs",
						data: faq,
					});
					return created;
				} catch (error) {
					console.error(`Error creating FAQ: ${faq.question}`, error);
					throw error;
				}
			}),
		);

		console.info(`✅ Created ${createdFAQs.length} FAQs`);
		return createdFAQs;
	} catch (error) {
		console.error("Error seeding FAQs:", error);
		throw error;
	}
};

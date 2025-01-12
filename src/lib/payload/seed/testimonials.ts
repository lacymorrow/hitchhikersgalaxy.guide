import { content } from "@/content/testimonials/testimonials-content";
import { payload } from "@/lib/payload/payload";

export const seedTestimonials = async () => {
	try {
		await payload?.delete({
			collection: "testimonials",
			where: {
				id: {
					exists: true,
				},
			},
		});

		const testimonials = content.map((testimonial) => ({
			...testimonial,
			name: testimonial.name!,
		}));

		const createdTestimonials = await Promise.all(
			testimonials.map(async (testimonial) => {
				if (typeof testimonial?.name !== "string") {
					return null;
				}

				try {
					const created = await payload?.create({
						collection: "testimonials",
						data: testimonial,
					});
					return created;
				} catch (error) {
					console.error(
						`Error creating testimonial: ${testimonial.name}`,
						error,
					);
					throw error;
				}
			}),
		);

		console.info(`✅ Created ${createdTestimonials.length} testimonials`);
		return createdTestimonials;
	} catch (error) {
		console.error("Error seeding testimonials:", error);
		throw error;
	}
};

import type { CollectionConfig } from "payload";
import { buildTimeFeatures } from "@/config/features-config";

export const Media: CollectionConfig = {
	slug: "media",
	access: {
		read: () => true,
	},
	fields: [
		{
			name: "alt",
			type: "text",
			required: true,
		},
	],
	upload: process.env.NODE_ENV !== "production" || buildTimeFeatures.FILE_UPLOAD_ENABLED,
};

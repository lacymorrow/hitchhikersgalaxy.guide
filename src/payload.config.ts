import path from "path";
import { fileURLToPath } from "url";

// storage-adapter-import-placeholder
import { postgresAdapter } from "@payloadcms/db-postgres";
import type { PostgresAdapter } from "@payloadcms/db-postgres/dist/types";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { FAQs } from "./lib/payload/collections/FAQs";
import { Features } from "./lib/payload/collections/Features";
import { Media } from "./lib/payload/collections/Media";
import { Pages } from "./lib/payload/collections/Pages";
import { RBAC } from "./lib/payload/collections/RBAC";
import { Testimonials } from "./lib/payload/collections/Testimonials";
import { Users } from "./lib/payload/collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
	secret:
		process.env.PAYLOAD_SECRET ?? process.env.AUTH_SECRET ?? "supersecret",
	routes: {
		admin: "/cms-admin",
		api: "/cms-api",
	},
	admin: {
		user: Users.slug,
		importMap: {
			baseDir: path.resolve(dirname),
		},
	},
	collections: [Users, Media, Features, FAQs, Testimonials, RBAC, Pages],
	editor: lexicalEditor(),
	typescript: {
		outputFile: path.resolve(dirname, "payload-types.ts"),
	},
	db: postgresAdapter({
		schemaName: "payload",
		pool: {
			connectionString: process.env.DATABASE_URL ?? "",
		},
		beforeSchemaInit: [
			({ schema, adapter }: { schema: any; adapter: PostgresAdapter }) => {
				/*
				 * Define relationships between Payload and application tables
				 * Only add relationships that are actually needed
				 *
				 * Key relationships:
				 * 1. Users - for authentication and user management
				 * 2. RBAC - for permissions and access control
				 * 3. Media - for asset management
				 */
				return {
					...schema,
					tables: {
						...schema.tables,
						// Users relationship - core authentication and user management
						users: {
							...schema.tables.users,
							relationships: [
								{
									relationTo: "shipkit_user",
									type: "oneToOne",
									onDelete: "CASCADE", // Delete app user when Payload user is deleted
								},
							],
						},
						// RBAC relationship - permissions and access control
						rbac: {
							...schema.tables.rbac,
							relationships: [
								{
									relationTo: "shipkit_role",
									type: "oneToMany",
								},
							],
						},
					},
				};
			},
		],
		migrationDir: path.resolve(dirname, "migrations"),
	}),
	sharp,
	plugins: [
		payloadCloudPlugin(),
		// storage-adapter-placeholder
	],
	telemetry: false,
});

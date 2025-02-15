import { z } from "zod";

export type ComponentMetadata = Record<string, any>;

// Define the registry types as a const array for single source of truth
const REGISTRY_TYPES = [
	"registry:lib",
	"registry:block",
	"registry:component",
	"registry:ui",
	"registry:hook",
	"registry:theme",
	"registry:page",
] as const;

// Create the enum from the array
export const RegistryType = z.enum(REGISTRY_TYPES);

// Create the type from the same array
export type RegistryTypeValue = (typeof REGISTRY_TYPES)[number];

// File type includes both registry types and preview
export const FileType = z.union([RegistryType, z.literal("preview")]);
export type FileTypeValue = z.infer<typeof FileType>;

// Component documentation sub-schemas
const PreviewSchema = z.object({
	code: z.string(),
	height: z.string().optional(),
	background: z.string().optional(),
});

const ExampleSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	code: z.string(),
});

const PropSchema = z.object({
	name: z.string(),
	type: z.string(),
	description: z.string(),
	required: z.boolean().optional(),
	default: z.string().optional(),
});

const UsageSchema = z.object({
	dos: z.array(z.string()).optional(),
	donts: z.array(z.string()).optional(),
	notes: z.array(z.string()).optional(),
});

export const ComponentDocSchema = z.object({
	title: z.string(),
	description: z.string(),
	author: z.string().optional(),
	version: z.string().optional(),
	status: z.enum(["stable", "beta", "deprecated"]).optional(),
	preview: PreviewSchema.optional(),
	examples: z.array(ExampleSchema).optional(),
	props: z.array(PropSchema).optional(),
	usage: UsageSchema.optional(),
	accessibility: z.string().optional(),
	customization: z.string().optional(),
});

export type ComponentDoc = z.infer<typeof ComponentDocSchema>;

// Style configuration schemas
const CSSVarsSchema = z.object({
	light: z.record(z.string()).optional(),
	dark: z.record(z.string()).optional(),
});

const TailwindConfigSchema = z.object({
	config: z.object({
		content: z.array(z.string()).optional(),
		theme: z.record(z.any()).optional(),
		plugins: z.array(z.string()).optional(),
	}),
});

// File schema
const FileSchema = z
	.object({
		path: z.string(),
		content: z.string(),
		type: FileType,
		target: z.string().optional(),
	})
	.required({
		path: true,
		type: true,
	});

// Main registry schema
export const ShadcnSchema = z
	.object({
		// Required properties
		name: z.string(),
		type: RegistryType,

		// Optional properties
		description: z.string().optional(),
		dependencies: z.array(z.string()).optional(),
		devDependencies: z.array(z.string()).optional(),
		registryDependencies: z.array(z.string()).optional(),
		files: z.array(FileSchema),

		// Style configurations
		tailwind: TailwindConfigSchema.optional(),
		cssVars: CSSVarsSchema.optional(),

		// Documentation and metadata
		meta: z
			.object({
				library: z.string().optional(),
				theme: z.string().optional(),
				previewFor: z.string().optional(),
				repository: z.string().optional(),
				bugs: z.string().optional(),
				hasPreview: z.boolean().optional(),
			})
			.optional(),
		docs: z.string().optional(),
		categories: z.array(z.string()).optional(),
		documentation: ComponentDocSchema.optional(),
	})
	.required({
		name: true,
		type: true,
	});

export type RegistryItem = z.infer<typeof ShadcnSchema>;
export interface DocItem {
	name: string;
	type: RegistryTypeValue;
	library: string;
	description?: string;
	previewPath?: string;
	sourcePath: string;
	categories?: string[];
	files: {
		path: string;
		content: string;
		type: string;
		target?: string;
	}[];
	dependencies?: string[];
	devDependencies?: string[];
	registryDependencies?: string[];
	docs?: string;
	meta?: Record<string, any>;
	cssVars?: Record<string, any>;
	tailwind?: {
		config: {
			content?: string[];
			theme?: Record<string, any>;
			plugins?: string[];
		};
	};
}

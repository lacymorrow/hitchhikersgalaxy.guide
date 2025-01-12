export type RegistryType =
	| "registry:lib"
	| "registry:block"
	| "registry:component"
	| "registry:ui"
	| "registry:hook"
	| "registry:theme"
	| "registry:page"
	| "preview";

export interface DocFile {
	path: string;
	content: string;
	type: RegistryType;
	target?: string;
}

export interface DocItem {
	name: string;
	type: Exclude<RegistryType, "preview">;
	description?: string;
	dependencies?: string[];
	devDependencies?: string[];
	registryDependencies?: string[];
	files: DocFile[];
	tailwind?: {
		config: {
			content?: string[];
			theme?: Record<string, any>;
			plugins?: string[];
		};
	};
	cssVars?: {
		light?: Record<string, string>;
		dark?: Record<string, string>;
	};
	meta?: {
		author?: string;
		license?: string;
		library?: string;
		hasPreview?: boolean;
		[key: string]: any;
	};
	docs?: string;
	categories?: string[];
}

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pluginNext from "@next/eslint-plugin-next";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
	// Configure global ignores (replaces .eslintignore)
	{
		ignores: [
			"node_modules/**",
			".cursor/**",
			".next/**",
			"src/app/(demo)/**/*",
			"src/components/blocks/**",
			"src/components/ui/**",
		],
	},

	// React flat config (avoids FlatCompat circular reference issue)
	{
		...pluginReact.configs.flat.recommended,
		settings: {
			react: { version: "detect" },
		},
	},
	pluginReact.configs.flat["jsx-runtime"],

	// React Hooks
	{
		plugins: {
			"react-hooks": pluginReactHooks,
		},
		rules: pluginReactHooks.configs.recommended.rules,
	},

	// Next.js plugin (core-web-vitals includes recommended)
	{
		plugins: {
			"@next/next": pluginNext,
		},
		rules: {
			...pluginNext.configs.recommended.rules,
			...pluginNext.configs["core-web-vitals"].rules,
		},
	},

	// TypeScript files configuration
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: ["./tsconfig.json"],
				tsconfigRootDir: __dirname,
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			"@typescript-eslint": ts,
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
		rules: {
			...(ts.configs["recommended-type-checked"]?.rules || {}),
			...(ts.configs["stylistic-type-checked"]?.rules || {}),
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/consistent-type-imports": [
				"warn",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
				},
			],
			"@typescript-eslint/ban-ts-comment": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-floating-promises": "warn",
			"@typescript-eslint/no-misused-promises": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
		},
	},

	// Workers: use dedicated tsconfig for typed linting
	{
		files: ["src/workers/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: ["./tsconfig.workers.json"],
				tsconfigRootDir: __dirname,
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: {
					jsx: false,
				},
			},
		},
		plugins: {
			"@typescript-eslint": ts,
		},
	},
];

export default eslintConfig;

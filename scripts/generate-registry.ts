#!/usr/bin/env node
import { Command } from "commander";
import path from "path";
import { generateAllBlocks } from "./generator";

const program = new Command();
program
	.name("generate-registry")
	.description("Generate registry JSON files from block directories")
	.requiredOption("-i, --input <dir>", "Input directory containing block directories")
	.requiredOption("-o, --output <dir>", "Output directory for registry JSON files")
	.option("-b, --base-config <file>", "Base configuration file for all blocks")
	.option("-t, --transform", "Transform imports to use registry paths", false)
	.parse(process.argv);

const options = program.opts();

async function main() {
	try {
		const baseConfig = options.baseConfig ? require(path.resolve(options.baseConfig)) : {};

		await generateAllBlocks({
			blocksDir: path.resolve(options.input),
			outputDir: path.resolve(options.output),
			baseConfig,
			contentTransform: options.transform
				? (content) => content.replace(/from ["']@\//g, 'from "@/registry/default/')
				: undefined,
		});

		console.log("Registry generation complete!");
	} catch (error) {
		console.error("Error generating registry:", error);
		process.exit(1);
	}
}

main();

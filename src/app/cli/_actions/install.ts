"use server";

import { spawn } from "child_process";
import { type InstallOptions } from "../_lib/types";
import { existsSync, mkdirSync, readdirSync, renameSync, rmdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Merge contents from source directory to target directory
 * @param sourcePath Source directory path
 * @param targetPath Target directory path
 * @param overwrite Whether to overwrite existing files
 */
async function mergeDirectories(sourcePath: string, targetPath: string, overwrite: boolean) {
	// Create target directory if it doesn't exist
	if (!existsSync(targetPath)) {
		mkdirSync(targetPath, { recursive: true });
	}

	// Read all items in source directory
	const items = readdirSync(sourcePath);

	for (const item of items) {
		const sourceItemPath = join(sourcePath, item);
		const targetItemPath = join(targetPath, item);

		const isDirectory = statSync(sourceItemPath).isDirectory();

		if (isDirectory) {
			// Recursively merge subdirectories
			await mergeDirectories(sourceItemPath, targetItemPath, overwrite);
		} else {
			// Handle files
			if (!existsSync(targetItemPath) || overwrite) {
				try {
					renameSync(sourceItemPath, targetItemPath);
				} catch (error) {
					console.error(`Failed to move ${sourceItemPath} to ${targetItemPath}:`, error);
				}
			}
		}
	}

	// Try to remove the source directory if it's empty
	try {
		rmdirSync(sourcePath);
	} catch (error) {
		// Ignore errors if directory is not empty
	}
}

/**
 * Handle post-installation directory structure
 * @param overwrite Whether to overwrite existing files
 */
async function handlePostInstall(overwrite: boolean) {
	const appPath = join(process.cwd(), "app");
	const srcAppPath = join(process.cwd(), "src", "app");

	// Only proceed if we have both directories
	if (existsSync(appPath) && existsSync(srcAppPath)) {
		try {
			await mergeDirectories(appPath, srcAppPath, overwrite);

			// Try to remove the /app directory if it still exists and is empty
			if (existsSync(appPath)) {
				const remainingItems = readdirSync(appPath);
				if (remainingItems.length === 0) {
					rmdirSync(appPath);
				}
			}
		} catch (error) {
			console.error("Error during post-install directory handling:", error);
		}
	}
}

/**
 * Install a component from a registry
 * @see https://ui.shadcn.com/docs/cli
 */
export async function installComponent(
	componentUrl: string,
	options: InstallOptions = {},
): Promise<ReadableStream<Uint8Array>> {
	const encoder = new TextEncoder();

	return new ReadableStream({
		async start(controller) {
			try {
				const args = ["shadcn@latest", "add"];

				// Add component name
				args.push(componentUrl);

				// Add options
				if (options.overwrite) args.push("--overwrite");
				if (options.style) args.push("--style", options.style);
				if (options.typescript) args.push("--typescript");
				if (options.path) args.push("--path", options.path);

				const process = spawn("npx", args, {
					stdio: ["pipe", "pipe", "pipe"],
				});

				// If not overwriting, automatically answer "n" to prompts
				if (!options.overwrite && process.stdin) {
					process.stdin.write("n\n");
					process.stdin.end();
				}

				process.stdout?.on("data", (data) => {
					controller.enqueue(encoder.encode(data));
				});

				process.stderr?.on("data", (data) => {
					controller.enqueue(encoder.encode(data));
				});

				process.on("close", async (code) => {
					if (code !== 0) {
						controller.enqueue(
							encoder.encode(`\nProcess exited with code ${code}`),
						);
					} else {
						// Handle post-installation directory structure
						await handlePostInstall(options.overwrite || false);
					}
					controller.close();
				});

				process.on("error", (err) => {
					controller.enqueue(encoder.encode(`\nError: ${err.message}`));
					controller.close();
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown error occurred";
				controller.enqueue(encoder.encode(`\nError: ${message}`));
				controller.close();
			}
		},
	});
}

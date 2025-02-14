"use server";

import { type ChildProcessWithoutNullStreams, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { InstallOptions } from "../_lib/types";

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

				// Detect project structure
				const hasSrcApp = existsSync(join(process.cwd(), "src", "app"));
				const hasRootApp = existsSync(join(process.cwd(), "app"));

				// If src/app exists, add --path src
				if (hasSrcApp && !hasRootApp) {
					args.push("--path", "src");
				}

				// Add options
				if (options.overwrite) args.push("--overwrite");
				if (options.style) args.push("--style", options.style);
				if (options.typescript) args.push("--typescript");
				if (options.path) args.push("--path", options.path);

				const childProcess = spawn("npx", args, {
					stdio: ["pipe", "pipe", "pipe"],
				});

				// If not overwriting, automatically answer "n" to prompts
				if (!options.overwrite && childProcess.stdin) {
					childProcess.stdin.write("n\n");
					childProcess.stdin.end();
				}

				childProcess.stdout?.on("data", (data) => {
					controller.enqueue(encoder.encode(data));
				});

				childProcess.stderr?.on("data", (data) => {
					controller.enqueue(encoder.encode(data));
				});

				childProcess.on("close", (code) => {
					if (code !== 0) {
						controller.enqueue(
							encoder.encode(`\nProcess exited with code ${code}`),
						);
					}
					controller.close();
				});

				childProcess.on("error", (err) => {
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

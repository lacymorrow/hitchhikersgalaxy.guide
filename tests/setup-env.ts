// Environment setup for tests
// This handles both browser and Node.js environments

// Set test-specific environment variables
process.env = {
	...process.env,
	NODE_ENV: "test",
	SKIP_ENV_VALIDATION: "1",
};

// Only load Next.js environment config in Node.js environment
// Browser environments already have environment variables processed at build time
if (typeof window === "undefined") {
	try {
		// Dynamic import to avoid browser compatibility issues
		import("@next/env")
			.then(({ loadEnvConfig }) => {
				loadEnvConfig(process.cwd());
			})
			.catch((error) => {
				console.warn("Error loading environment variables:", error);
			});

		// Patch next-auth test runtime when Next.js module pathing differs
		// Some versions expect next/server; in Vitest we can noop this
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			require.resolve("next/server");
		} catch {
			// Provide a minimal shim for next/server to satisfy next-auth env loading in tests
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const Module = require("module");
			const originalResolve = Module._resolveFilename;
			Module._resolveFilename = function (request: string, parent: unknown, isMain: boolean, options: any) {
				if (request === "next/server") {
					// Redirect to the ESM file if available; otherwise provide a noop shim
					try {
						return originalResolve.call(this, "next/server.js", parent, isMain, options);
					} catch {
						return originalResolve.call(this, "node:module", parent, isMain, options);
					}
				}
				return originalResolve.call(this, request, parent, isMain, options);
			} as any;
		}
	} catch (error) {
		console.warn("Error importing @next/env:", error);
	}
}

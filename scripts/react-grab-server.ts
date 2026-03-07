import { createRequire } from "node:module";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const require = createRequire(import.meta.url);

loadEnvConfig(process.cwd());

function writeMessage(message: string, stream: "stdout" | "stderr" = "stdout") {
	process[stream].write(`${message}\n`);
}

function envIsTrue(name: string): boolean {
	const value = process.env[name]?.toLowerCase().trim();
	return ["true", "1", "yes", "on", "enable", "enabled"].includes(value ?? "");
}

async function startReactGrabServer() {
	if (!envIsTrue("ENABLE_REACT_GRAB")) return;

	const { reactGrabConfig } = (await import("../src/config/react-grab-config")) as {
		reactGrabConfig: {
			enabled: boolean;
			provider?: {
				id: string;
				packageName: string;
				env: string | undefined;
			};
		};
	};

	if (!reactGrabConfig.enabled || !reactGrabConfig.provider) {
		writeMessage(
			"[react-grab] ENABLE_REACT_GRAB is on but no supported AI provider is configured.",
			"stderr"
		);
		return;
	}

	// `env` is the resolved API key value — loadEnvConfig already set it in process.env.
	// We check for its presence here to give a clear early error rather than a provider-level crash.
	if (!reactGrabConfig.provider.env) {
		writeMessage(
			`[react-grab] ${reactGrabConfig.provider.id} is selected but its API key is missing.`,
			"stderr"
		);
		return;
	}

	try {
		const providerServer = require(`${reactGrabConfig.provider.packageName}/server`) as {
			startServer: () => void;
		};

		providerServer.startServer();
		writeMessage(`[react-grab] Started ${reactGrabConfig.provider.id} provider server.`);
	} catch (error) {
		writeMessage(
			`[react-grab] Failed to start the ${reactGrabConfig.provider.id} provider server.`,
			"stderr"
		);
		writeMessage(String(error), "stderr");
		process.exit(1);
	}
}

void startReactGrabServer();

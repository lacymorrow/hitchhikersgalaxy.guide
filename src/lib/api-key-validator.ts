import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface ApiKeyInfo {
	id: string;
	name: string;
	createdAt: string;
	lastUsedAt: string;
	rateLimit: {
		requests: number;
		duration: string;
	};
}

export async function validateApiKey(
	apiKey: string,
): Promise<ApiKeyInfo | null> {
	const keyInfo = await redis.get<ApiKeyInfo>(`api-key:${apiKey}`);
	if (!keyInfo) return null;

	// Update last used timestamp
	await redis.hset(`api-key:${apiKey}`, {
		lastUsedAt: new Date().toISOString(),
	});

	return keyInfo;
}

export async function createApiKey(
	name: string,
	rateLimit = { requests: 1000, duration: "1d" },
): Promise<{ apiKey: string; info: ApiKeyInfo }> {
	const apiKey = `sk_${nanoid(32)}`;
	const info: ApiKeyInfo = {
		id: nanoid(),
		name,
		createdAt: new Date().toISOString(),
		lastUsedAt: new Date().toISOString(),
		rateLimit,
	};

	await redis.set(`api-key:${apiKey}`, info);
	return { apiKey, info };
}

export async function revokeApiKey(apiKey: string): Promise<boolean> {
	return (await redis.del(`api-key:${apiKey}`)) > 0;
}

export async function listApiKeys(): Promise<
	{ key: string; info: ApiKeyInfo }[]
> {
	const keys = await redis.keys("api-key:*");
	const apiKeys = await Promise.all(
		keys.map(async (key) => ({
			key: key.replace("api-key:", ""),
			info: await redis.get<ApiKeyInfo>(key),
		})),
	);

	return apiKeys.filter(
		(k): k is { key: string; info: ApiKeyInfo } => k.info !== null,
	);
}

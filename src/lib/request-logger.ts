import { Redis } from "@upstash/redis";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RequestLog {
	timestamp: string;
	ip: string;
	method: string;
	path: string;
	statusCode: number;
	duration: number;
	apiKey: string;
}

export async function logRequest(data: RequestLog) {
	const key = `request-logs:${new Date().toISOString().split("T")[0]}`;

	// Store log in Redis with 30-day expiry
	await redis.lpush(key, JSON.stringify(data));
	await redis.expire(key, 60 * 60 * 24 * 30); // 30 days
}

export async function getRecentLogs(days = 7): Promise<RequestLog[]> {
	const keys = [];
	const now = new Date();

	// Get keys for the last n days
	for (let i = 0; i < days; i++) {
		const date = new Date(now);
		date.setDate(date.getDate() - i);
		keys.push(`request-logs:${date.toISOString().split("T")[0]}`);
	}

	// Get all logs
	const logs = await Promise.all(keys.map((key) => redis.lrange(key, 0, -1)));

	// Parse and flatten logs
	return logs
		.flat()
		.map((log) => JSON.parse(log))
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);
}

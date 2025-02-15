import { db } from "@/server/db";
import { apiKeys, logs } from "@/server/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";

/**
 * Returns an async iterable stream of logs for a given API key ID
 * @param apiKeyId - The ID of the API key to fetch logs for
 */
export const streamApiLogs = async function* (apiKeyId: string) {
	let lastTimestamp = new Date(0); // Start from the beginning of time

	// Check both apiKeys and testApiKeys tables
	const apiKeyRecord = await db.query.apiKeys.findFirst({
		where: eq(apiKeys.id, apiKeyId),
	});

	if (!apiKeyRecord?.id) {
		throw new Error("Invalid API key ID");
	}

	while (true) {
		const newLogs = await db
			.select()
			.from(logs)
			.where(
				and(
					eq(logs.apiKeyId, apiKeyRecord.id),
					gt(logs.timestamp, lastTimestamp),
				),
			)
			.orderBy(desc(logs.timestamp))
			.limit(10);

		for (const log of newLogs.reverse()) {
			yield {
				id: log.id,
				level: log.level,
				message: log.message,
				timestamp: log.timestamp.toISOString(),
				prefix: log.prefix ?? "", // Include the prefix field, defaulting to empty string if null
				metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
			};
			lastTimestamp = log.timestamp;
		}

		// Wait for a short period before checking for new logs
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
};

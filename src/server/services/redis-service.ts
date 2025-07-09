import { Redis } from "@upstash/redis";
import { env } from "@/env";
import { logger } from "@/lib/logger";

let redisClient: Redis | null = null;

if (env.NEXT_PUBLIC_FEATURE_REDIS_ENABLED) {
	// Explicitly check required env vars for type safety
	if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
		logger.error(
			"❌ Redis feature is enabled, but UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN are missing."
		);
	} else {
		try {
			redisClient = new Redis({
				url: env.UPSTASH_REDIS_REST_URL,
				token: env.UPSTASH_REDIS_REST_TOKEN,
			});
			logger.info("✅ Redis Client Initialized (from redis-service)");
		} catch (error) {
			logger.error("❌ Failed to initialize Redis client (from redis-service):", error);
			// Keep redisClient as null if initialization fails
		}
	}
}

/**
 * The initialized Upstash Redis client instance.
 * Will be `null` if Redis is disabled or fails to initialize.
 */
export { redisClient };

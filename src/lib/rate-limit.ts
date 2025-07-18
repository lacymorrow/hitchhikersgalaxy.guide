import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let rateLimiter: Ratelimit | null = null;

// Only initialize Redis if credentials are available
if (
	process.env.UPSTASH_REDIS_REST_URL &&
	process.env.UPSTASH_REDIS_REST_TOKEN
) {
	redis = new Redis({
		url: process.env.UPSTASH_REDIS_REST_URL,
		token: process.env.UPSTASH_REDIS_REST_TOKEN,
	});

	// Create a new ratelimiter that allows 10 requests per 10 seconds per IP
	rateLimiter = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(10, "10 s"),
		analytics: true,
		prefix: "spam-api",
	});
}

export { redis, rateLimiter };
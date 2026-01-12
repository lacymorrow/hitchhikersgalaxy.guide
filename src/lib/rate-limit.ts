import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

if (
	!process.env.UPSTASH_REDIS_REST_URL ||
	!process.env.UPSTASH_REDIS_REST_TOKEN
) {
	console.warn("Redis credentials are not configured");
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a new ratelimiter that allows 10 requests per 10 seconds per IP
export const rateLimiter = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(10, "10 s"),
	analytics: true,
	prefix: "spam-api",
});

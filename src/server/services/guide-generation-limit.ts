import "server-only";
import { gte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";
import { rateLimitService } from "@/server/services/rate-limit-service";

/**
 * Limits on creating new Guide entries (AI generation and submissions).
 * Lookups of existing entries are never limited.
 *
 * Per IP: Upstash when it is configured (the shared rate-limit service),
 * otherwise an in-memory sliding window per server instance. Production has
 * no Upstash today, so the in-memory window is the per-IP layer there; it is
 * best effort across instances, which is why the global cap below exists.
 *
 * Global: a count of rows created in the last hour, straight from the
 * database. Caps OpenAI spend even if a crawler rotates IPs.
 */
export const GENERATION_LIMITS = {
	perIp: { requests: 10, duration: 10 * 60 },
	globalPerHour: 60,
} as const;

const memoryHits = new Map<string, number[]>();
const MEMORY_MAX_KEYS = 5000;

function allowInMemory(ip: string, now = Date.now()): boolean {
	const windowMs = GENERATION_LIMITS.perIp.duration * 1000;
	const recent = (memoryHits.get(ip) ?? []).filter((t) => now - t < windowMs);
	if (recent.length >= GENERATION_LIMITS.perIp.requests) {
		memoryHits.set(ip, recent);
		return false;
	}
	recent.push(now);
	memoryHits.set(ip, recent);
	if (memoryHits.size > MEMORY_MAX_KEYS) {
		const oldest = memoryHits.keys().next().value;
		if (oldest !== undefined) memoryHits.delete(oldest);
	}
	return true;
}

async function getClientIp(): Promise<string> {
	try {
		const h = await headers();
		return (
			h.get("x-real-ip") ??
			h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
			"unknown"
		);
	} catch {
		return "unknown";
	}
}

async function allowPerIp(ip: string): Promise<boolean> {
	if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
		try {
			await rateLimitService.checkLimit(ip, "guide-generate", GENERATION_LIMITS.perIp);
			return true;
		} catch {
			return false;
		}
	}
	return allowInMemory(ip);
}

/**
 * Whether the hourly cap leaves room for another entry.
 *
 * Fails closed. A cap that cannot be read is a cap that is not enforced, and
 * the failure that blinds it is the same failure that sends every entry URL
 * down the generation path: an unreachable database. Returning `true` here
 * meant an outage turned the OpenAI spend limiter off at the exact moment it
 * had the most to stop, with a crawler sweep multiplying the bill by the
 * number of entries (LAC-5648). Refusing to generate while blind costs a
 * handful of new terms during an outage; allowing it costs money.
 */
async function allowGlobal(): Promise<boolean> {
	if (!db) {
		console.warn("[guide-generation-limit] no database configured; refusing creation");
		return false;
	}
	try {
		const since = new Date(Date.now() - 60 * 60 * 1000);
		const [row] = await db
			.select({ count: sql<number>`count(*)` })
			.from(guideEntries)
			.where(gte(guideEntries.createdAt, since));
		return Number(row?.count ?? 0) < GENERATION_LIMITS.globalPerHour;
	} catch (error) {
		console.error("[guide-generation-limit] global count failed; refusing creation:", error);
		return false;
	}
}

/** True when this request may create a new Guide entry. */
export async function allowGuideCreation(): Promise<boolean> {
	const ip = await getClientIp();
	if (!(await allowPerIp(ip))) {
		console.warn("[guide-generation-limit] per-IP limit hit");
		return false;
	}
	if (!(await allowGlobal())) {
		console.warn("[guide-generation-limit] global hourly cap hit");
		return false;
	}
	return true;
}

import { db } from "@/server/db";
import { guideEntries } from "@/server/db/schema";
import { and, desc, asc, gte, lte, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20),
	search: z.string().optional(),
	startDate: z.string().datetime().optional(),
	endDate: z.string().datetime().optional(),
	orderBy: z
		.enum(["createdAt", "updatedAt", "searchTerm", "id"])
		.default("createdAt"),
	orderDir: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(request: Request) {
	if (!db) {
		return NextResponse.json(
			{ error: "Database not available" },
			{ status: 503 },
		);
	}

	try {
		const { searchParams } = new URL(request.url);

		const validationResult = querySchema.safeParse({
			page: searchParams.get("page") ?? undefined,
			limit: searchParams.get("limit") ?? undefined,
			search: searchParams.get("search") ?? undefined,
			startDate: searchParams.get("startDate") ?? undefined,
			endDate: searchParams.get("endDate") ?? undefined,
			orderBy: searchParams.get("orderBy") ?? undefined,
			orderDir: searchParams.get("orderDir") ?? undefined,
		});

		if (!validationResult.success) {
			return NextResponse.json(
				{ error: "Invalid parameters", details: validationResult.error.issues },
				{ status: 400 },
			);
		}

		const { page, limit, search, startDate, endDate, orderBy, orderDir } =
			validationResult.data;
		const offset = (page - 1) * limit;

		const conditions = [];

		if (search) {
			conditions.push(ilike(guideEntries.searchTerm, `%${search}%`));
		}

		if (startDate) {
			conditions.push(gte(guideEntries.createdAt, new Date(startDate)));
		}

		if (endDate) {
			conditions.push(lte(guideEntries.createdAt, new Date(endDate)));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const orderColumn = guideEntries[orderBy];
		const orderFn = orderDir === "desc" ? desc : asc;

		const [entries, countResult] = await Promise.all([
			db.query.guideEntries.findMany({
				where: whereClause,
				limit,
				offset,
				orderBy: orderFn(orderColumn),
				columns: {
					id: true,
					searchTerm: true,
					content: true,
					reliability: true,
					dangerLevel: true,
					travelAdvice: true,
					whereToFind: true,
					whatToAvoid: true,
					funFact: true,
					advertisement: true,
					contributorId: true,
					createdAt: true,
					updatedAt: true,
				},
			}),
			db
				.select({ count: sql<number>`count(*)` })
				.from(guideEntries)
				.where(whereClause),
		]);

		const total = Number(countResult[0]?.count ?? 0);

		return NextResponse.json({
			data: entries,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("[Submissions API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch submissions" },
			{ status: 500 },
		);
	}
}

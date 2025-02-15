"use server";

import { generateReport } from "./report-service";
import type { Report } from "./report-service";

interface ReportResponse {
	success: boolean;
	data?: Report;
	error?: string;
}

export async function generateReportAction(
	formData: FormData,
): Promise<ReportResponse> {
	try {
		const topic = formData.get("topic");
		if (!topic || typeof topic !== "string") {
			return {
				success: false,
				error: "Topic is required",
			};
		}

		const result = await generateReport(topic);
		return {
			success: true,
			data: result,
		};
	} catch (error) {
		console.error("Error generating report:", error);
		return {
			success: false,
			error: "Failed to generate report. Please try again.",
		};
	}
}

import { NextResponse } from "next/server";
import type { Report } from "../../report-service";
import { jsPDF } from "jspdf";

export async function POST(request: Request) {
	try {
		const report: Report = await request.json();

		// Create a PDF document
		const doc = new jsPDF();
		let y = 20; // Starting y position
		const margin = 20;
		const pageWidth = doc.internal.pageSize.getWidth();
		const contentWidth = pageWidth - margin * 2;

		// Helper function to add text with proper wrapping and spacing
		function addText(text: string, fontSize: number, indent = 0) {
			doc.setFontSize(fontSize);
			const lines = doc.splitTextToSize(text, contentWidth - indent);
			doc.text(lines, margin + indent, y);
			y += lines.length * fontSize * 0.352778 + 10; // Convert pt to mm

			// Check if we need a new page
			if (y > doc.internal.pageSize.getHeight() - margin) {
				doc.addPage();
				y = margin;
			}
		}

		// Title
		doc.setFontSize(24);
		const titleLines = doc.splitTextToSize(report.title, contentWidth);
		doc.text(titleLines, pageWidth / 2, y, { align: "center" });
		y += titleLines.length * 24 * 0.352778 + 15;

		// Executive Summary
		doc.setFontSize(16);
		doc.text("Executive Summary", margin, y);
		y += 10;
		addText(report.summary, 12);
		y += 5;

		// Sections
		for (const section of report.sections) {
			addText(section.title, 16);
			addText(section.content, 12);
			y += 5;
		}

		// Recommendations
		if (report.recommendations.length > 0) {
			addText("Recommendations", 16);
			for (const recommendation of report.recommendations) {
				addText(`• ${recommendation}`, 12, 5);
				y -= 5; // Reduce extra spacing between bullets
			}
			y += 10;
		}

		// Sources
		if (report.sources.length > 0) {
			addText("Sources", 16);
			for (const source of report.sources) {
				addText(`• ${source}`, 12, 5);
				y -= 5; // Reduce extra spacing between bullets
			}
		}

		// Convert to blob
		const pdfBlob = doc.output("blob");

		// Return the PDF
		return new NextResponse(pdfBlob, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": "attachment; filename=report.pdf",
			},
		});
	} catch (error) {
		console.error("Error generating PDF:", error);
		return NextResponse.json(
			{ error: "Failed to generate PDF" },
			{ status: 500 },
		);
	}
}

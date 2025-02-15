"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type AnimationMetadata } from "../../types";

const STAGES = {
	INITIAL: [0, 30], // Initial state
	HEADER: [31, 90], // Invoice header
	ITEMS: [91, 150], // Line items
	TOTALS: [151, 210], // Totals calculation
	FINALIZE: [211, 270], // Finalize and send
} as const;

interface InvoiceItem {
	description: string;
	quantity: number;
	price: number;
}

const items: InvoiceItem[] = [
	{
		description: "Pro Plan Subscription",
		quantity: 1,
		price: 29.99,
	},
	{
		description: "Additional User Seats",
		quantity: 2,
		price: 9.99,
	},
	{
		description: "API Credits",
		quantity: 1000,
		price: 0.05,
	},
];

export const InvoiceFlow = () => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();

	// Calculate progress for each stage
	const headerProgress = interpolate(frame, STAGES.HEADER, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const itemsProgress = interpolate(frame, STAGES.ITEMS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const totalsProgress = interpolate(frame, STAGES.TOTALS, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const finalizeProgress = interpolate(frame, STAGES.FINALIZE, [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Calculate totals
	const subtotal = items.reduce(
		(acc, item) => acc + item.quantity * item.price,
		0,
	);
	const tax = subtotal * 0.1; // 10% tax
	const total = subtotal + tax;

	return (
		<div style={{ position: "relative", width: "100%", height: "100%" }}>
			<div className="absolute inset-0 flex items-center justify-center bg-background">
				<div className="relative w-[80%] min-w-[1000px] max-w-[1600px] rounded-2xl border-2 bg-card p-16 shadow-xl">
					{/* Invoice Content */}
					<div className="space-y-12">
						{/* Invoice Header */}
						<div className="space-y-8">
							<h2 className="text-6xl font-bold text-foreground">Invoice</h2>
							<div className="flex justify-between">
								<div className="space-y-4">
									<div className="text-3xl text-muted-foreground">From</div>
									<div className="text-2xl">Your Company Name</div>
									<div className="text-xl text-muted-foreground">
										123 Business Street
										<br />
										City, State 12345
									</div>
								</div>
								<div className="space-y-4 text-right">
									<div className="text-3xl text-muted-foreground">
										Invoice #
									</div>
									<div className="text-2xl">INV-2024-001</div>
									<div className="text-xl text-muted-foreground">
										Date: Jan 1, 2024
									</div>
								</div>
							</div>
						</div>

						{/* Line Items */}
						{itemsProgress > 0 && (
							<div className="space-y-8">
								<div className="text-3xl text-muted-foreground">Items</div>
								<table className="w-full">
									<thead>
										<tr className="border-b-2 text-2xl">
											<th className="pb-4 text-left">Description</th>
											<th className="pb-4 text-right">Amount</th>
										</tr>
									</thead>
									<tbody className="text-xl">
										{items.map((item, i) => (
											<tr
												key={item.description}
												className="border-b"
												style={{
													opacity: interpolate(
														itemsProgress,
														[i * 0.2, i * 0.2 + 0.2],
														[0, 1],
														{
															extrapolateLeft: "clamp",
															extrapolateRight: "clamp",
														},
													),
												}}
											>
												<td className="py-6">{item.description}</td>
												<td className="py-6 text-right">
													${item.quantity * item.price}
												</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr>
											<td className="pt-8 text-2xl font-bold">Total</td>
											<td className="pt-8 text-right text-3xl font-bold text-primary">
												$
												{items
													.reduce(
														(sum, item) => sum + item.quantity * item.price,
														0,
													)
													.toFixed(2)}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
						)}

						{/* Processing */}
						{totalsProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: totalsProgress }}
							>
								<div className="h-16 w-16 animate-spin rounded-full border-8 border-primary border-t-transparent" />
							</div>
						)}

						{/* Success */}
						{finalizeProgress > 0 && (
							<div
								className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm"
								style={{ opacity: finalizeProgress }}
							>
								<div className="space-y-4 text-center">
									<div className="text-7xl text-green-500">✓</div>
									<div className="text-4xl font-semibold text-primary">
										Invoice Generated
									</div>
									<div className="text-2xl text-muted-foreground">
										Your invoice has been generated and sent
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export const invoiceFlowMetadata: AnimationMetadata = {
	id: "invoice-flow",
	title: "Invoice Generation",
	description: "Visualization of invoice generation and processing",
	category: "payments",
	duration: 9,
	fps: 30,
	width: 1920,
	height: 1080,
	createdAt: new Date(),
	updatedAt: new Date(),
};

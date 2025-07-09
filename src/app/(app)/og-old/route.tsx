import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const title = searchParams.get("title") ?? "ShipKit";
		const description = searchParams.get("description") ?? "Next.js starter template";
		const mode = searchParams.get("mode") ?? "dark";

		const isDark = mode === "dark";
		const backgroundColor = isDark ? "#020617" : "#ffffff";
		const textColor = isDark ? "#ffffff" : "#000000";
		const subtitleColor = isDark ? "#94a3b8" : "#64748b";

		return new ImageResponse(
			<div
				style={{
					height: "100%",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor,
					fontFamily: "system-ui, sans-serif",
					padding: "80px",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						textAlign: "center",
						gap: "32px",
					}}
				>
					<div
						style={{
							fontSize: "72px",
							fontWeight: "bold",
							color: textColor,
							lineHeight: 1.1,
						}}
					>
						{title}
					</div>
					<div
						style={{
							fontSize: "32px",
							color: subtitleColor,
							maxWidth: "800px",
							lineHeight: 1.2,
						}}
					>
						{description}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "16px",
							fontSize: "24px",
							color: subtitleColor,
						}}
					>
						<div
							style={{
								width: "48px",
								height: "48px",
								borderRadius: "12px",
								backgroundColor: isDark ? "#3b82f6" : "#2563eb",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "white",
								fontSize: "24px",
							}}
						>
							🚀
						</div>
						<span>shipkit.io</span>
					</div>
				</div>
			</div>,
			{
				width: 1200,
				height: 630,
			}
		);
	} catch (error) {
		console.error("Error generating OG image:", error);
		return new Response("Failed to generate image", { status: 500 });
	}
}

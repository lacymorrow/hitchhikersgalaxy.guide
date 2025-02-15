// Basic usage
// https://your-site.com/api/og

// With custom title
// https://your-site.com/api/og?title=Custom%20Title

// With custom description
// https://your-site.com/api/og?description=Custom%20Description

// With light mode
// https://your-site.com/api/og?mode=light

// Full customization
// https://your-site.com/api/og?title=Custom%20Title&description=Custom%20Description&mode=dark

import { siteConfig } from "@/config/site";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// const interRegular = fetch(
// 	new URL("../../../assets/fonts/Inter-Regular.ttf", import.meta.url)
// ).then((res) => res.arrayBuffer());

// const interBold = fetch(
// 	new URL("../../../assets/fonts/Inter-Bold.ttf", import.meta.url)
// ).then((res) => res.arrayBuffer());

export async function GET(req: NextRequest) {
	try {
		// const [interRegularData, interBoldData] = await Promise.all([
		// 	interRegular,
		// 	interBold,
		// ]);

		const { searchParams } = new URL(req.url);
		const title = searchParams.get("title") ?? siteConfig.title;
		const mode = searchParams.get("mode") ?? "dark";
		const description = searchParams.get("description") ?? siteConfig.description;
		const type = searchParams.get("type") ?? "default";

		const isDark = mode === "dark";
		const bgColor = isDark ? "#000000" : "#ffffff";
		const textColor = isDark ? "#ffffff" : "#000000";

		return new ImageResponse(
			(
				<div
					style={{
						height: "100%",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: bgColor,
						position: "relative",
					}}
				>
					{/* Gradient Background */}
					<div
						style={{
							position: "absolute",
							inset: 0,
							background: isDark
								? "radial-gradient(circle at 25% 25%, rgba(143, 0, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0, 255, 200, 0.2) 0%, transparent 50%)"
								: "radial-gradient(circle at 25% 25%, rgba(143, 0, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0, 255, 200, 0.1) 0%, transparent 50%)",
						}}
					/>

					{/* Grid Pattern */}
					<div
						style={{
							position: "absolute",
							inset: 0,
							backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px)`,
							backgroundSize: "32px 32px",
						}}
					/>

					{/* Content Container */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 24,
							maxWidth: "80%",
							textAlign: "center",
							zIndex: 10,
						}}
					>
						{/* Logo */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
							}}
						>
							<div
								style={{
									width: 64,
									height: 64,
									background: "linear-gradient(45deg, #FF61D8, #8C52FF)",
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 32,
								}}
							>
								🚀
							</div>
						</div>

						{/* Title */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 8,
							}}
						>
							<h1
								style={{
									fontSize: 64,
									fontWeight: 700,
									letterSpacing: "-0.05em",
									lineHeight: 1.1,
									color: textColor,
									margin: 0,
									padding: 0,
								}}
							>
								{title}
							</h1>
							<p
								style={{
									fontSize: 32,
									color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
									margin: 0,
									padding: 0,
								}}
							>
								{description}
							</p>
						</div>

						{/* Type Badge */}
						{type !== "default" && (
							<div
								style={{
									background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
									padding: "8px 16px",
									borderRadius: 9999,
									fontSize: 24,
									color: textColor,
									textTransform: "capitalize",
								}}
							>
								{type}
							</div>
						)}
					</div>

					{/* Bottom Gradient */}
					<div
						style={{
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							height: "30%",
							background: `linear-gradient(to top, ${bgColor}, transparent)`,
							zIndex: 5,
						}}
					/>

					{/* Decorative Elements */}
					<div
						style={{
							position: "absolute",
							top: 40,
							right: 40,
							width: 120,
							height: 120,
							background: "linear-gradient(45deg, #FF61D8, #8C52FF)",
							filter: "blur(60px)",
							borderRadius: "50%",
							opacity: 0.5,
						}}
					/>
					<div
						style={{
							position: "absolute",
							bottom: 40,
							left: 40,
							width: 120,
							height: 120,
							background: "linear-gradient(45deg, #8C52FF, #5CE1E6)",
							filter: "blur(60px)",
							borderRadius: "50%",
							opacity: 0.5,
						}}
					/>
				</div>
			),
			{
				width: 1200,
				height: 630,
				// fonts: [
				// 	{
				// 		name: "Inter",
				// 		data: interRegularData,
				// 		weight: 400,
				// 		style: "normal",
				// 	},
				// 	{
				// 		name: "Inter",
				// 		data: interBoldData,
				// 		weight: 700,
				// 		style: "normal",
				// 	},
				// ],
			}
		);
	} catch (e) {
		console.error(e);
		return new Response("Failed to generate image", { status: 500 });
	}
}

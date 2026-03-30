export const BASE_URL =
	process.env.NODE_ENV === "production"
		? (process.env.URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://localhost"))
		: typeof window !== "undefined"
			? window.location.origin
			: `http://localhost:${process.env.PORT ?? 3000}`;

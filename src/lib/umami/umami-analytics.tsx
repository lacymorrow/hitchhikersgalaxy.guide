import Script from "next/script";
import { env } from "@/env";
export const UmamiAnalytics = () => {
	if (!env?.NEXT_PUBLIC_UMAMI_WEBSITE_ID) return null;
	return (
		<Script
			src="https://umami-woad-two.vercel.app/script.js"
			data-website-id={env?.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
			defer
		/>
	);
};

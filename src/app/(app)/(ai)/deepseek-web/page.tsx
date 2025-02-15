// @ts-nocheck
'use client';

import dynamic from "next/dynamic";

const AIDeepSeekWeb = dynamic(async () => {
	const module = await import('./ai-deepseek-web');
	return module.AIDeepSeekWeb;
}, { ssr: false });

export default function Page() {
	return <AIDeepSeekWeb />;
}


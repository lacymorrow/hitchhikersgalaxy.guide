// @ts-nocheck
'use client';
import dynamic from "next/dynamic";

const AISemanticSearch = dynamic(async () => {
	const module = await import('./ai-semantic-search');
	return module.AISemanticSearch;
}, { ssr: false });

export default function Page() {
	return <AISemanticSearch />;
}

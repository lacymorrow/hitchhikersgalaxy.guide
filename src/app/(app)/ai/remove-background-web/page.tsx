// @ts-nocheck
'use client';
import dynamic from "next/dynamic";

const BackgroundRemovalDemo = dynamic(async () => {
	const module = await import('./ai-background-removal');
	return module.BackgroundRemovalDemo;
}, { ssr: false });

export default function Page() {
	return <BackgroundRemovalDemo />;
}

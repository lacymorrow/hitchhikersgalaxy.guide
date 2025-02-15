'use client';
import dynamic from 'next/dynamic';

// Dynamically import the component with no SSR
const AIBackgroundRemoval = dynamic(
	() => import('./ai-background-removal').then(mod => mod.AIBackgroundRemoval),
	{ ssr: false }
);

export default function Page() {
	return (
		<AIBackgroundRemoval />
	);
}

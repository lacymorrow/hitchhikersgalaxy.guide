// @ts-nocheck
'use client';
import dynamic from 'next/dynamic';

const AISmolvmWebgpu = dynamic(async () => {
	const module = await import('./ai-smolvm-webgpu');
	return module.AISmolvmWebgpu;
}, { ssr: false });

export default function Page() {
	return <AISmolvmWebgpu />;
}

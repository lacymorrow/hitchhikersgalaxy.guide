// @ts-nocheck
'use client';

import dynamic from "next/dynamic";

const AIMoonshineWeb = dynamic(async () => {
	const module = await import('./ai-moonshine-web');
	return module.AIMoonshineWeb;
}, { ssr: false });

export default function Page() {
	return <AIMoonshineWeb />;
}

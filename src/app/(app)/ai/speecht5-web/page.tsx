// @ts-nocheck
'use client';
import dynamic from "next/dynamic";

const App = dynamic(async () => {
	const module = await import('./App');
	return module.default;
}, { ssr: false });

export default function Page() {
	return <App />;
}

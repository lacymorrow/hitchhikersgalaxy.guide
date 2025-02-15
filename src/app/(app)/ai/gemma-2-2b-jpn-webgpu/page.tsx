// @ts-nocheck
'use client';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const AIDemo = dynamic(async () => {
	const module = await import('./App');
	return module.default;
}, { ssr: false });

export default function Page() {
	return (
		<>
			<Script
				id="mathjax-script"
				src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
				strategy="lazyOnload"
				onLoad={() => {
					window.MathJax = {
						tex: {
							inlineMath: [['$', '$'], ['\\(', '\\)']],
							displayMath: [['$$', '$$'], ['\\[', '\\]']],
						},
						svg: {
							fontCache: 'global'
						}
					};
				}}
			/>
			<AIDemo />
		</>
	)
}

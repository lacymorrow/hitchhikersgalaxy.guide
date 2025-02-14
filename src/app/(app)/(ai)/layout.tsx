
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div>
			{children}
			{/* <Attribution variant="banner" href="https://github.com/huggingface/transformers.js-examples">
				<Link className="text-center" href="https://github.com/huggingface/transformers.js-examples">
					Adapted from the wonderful repo on <b>Hugging Face</b>
				</Link>
			</Attribution> */}

		</div>
	);
}

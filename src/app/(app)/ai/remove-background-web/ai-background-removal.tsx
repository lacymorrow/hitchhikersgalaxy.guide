// @ts-nocheck
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AutoModel, AutoProcessor, RawImage } from "@huggingface/transformers";
import type { CSSProperties } from "react";

// Constants
const EXAMPLE_URL =
	"https://images.pexels.com/photos/5965592/pexels-photo-5965592.jpeg?auto=compress&cs=tinysrgb&w=1024";

export function BackgroundRemovalDemo() {
	const [status, setStatus] = useState("Loading model...");
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [containerStyle, setContainerStyle] = useState<CSSProperties>({});
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const modelRef = useRef<any>(null);
	const processorRef = useRef<any>(null);

	// Initialize model and processor
	useEffect(() => {
		async function init() {
			try {
				modelRef.current = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
					config: { model_type: "custom" },
				});

				processorRef.current = await AutoProcessor.from_pretrained("briaai/RMBG-1.4", {
					config: {
						do_normalize: true,
						do_pad: false,
						do_rescale: true,
						do_resize: true,
						image_mean: [0.5, 0.5, 0.5],
						feature_extractor_type: "ImageFeatureExtractor",
						image_std: [1, 1, 1],
						resample: 2,
						rescale_factor: 0.00392156862745098,
						size: { width: 1024, height: 1024 },
					},
				});

				setStatus("Ready");
			} catch (error) {
				console.error("Failed to initialize model:", error);
				setStatus("Failed to load model. Please try again.");
			}
		}

		init();
	}, []);

	// Handle file upload
	const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => predict(e.target?.result as string);
		reader.readAsDataURL(file);
	}, []);

	// Handle click and keyboard events
	const handleUploadClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleUploadKeyPress = useCallback((event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			fileInputRef.current?.click();
		}
	}, []);

	const handleExampleClick = useCallback((event: React.MouseEvent) => {
		event.stopPropagation();
		predict(EXAMPLE_URL);
	}, []);

	const handleExampleKeyPress = useCallback((event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			event.stopPropagation();
			predict(EXAMPLE_URL);
		}
	}, []);

	// Predict function to remove background
	const predict = async (url: string) => {
		try {
			// Read image
			const image = await RawImage.fromURL(url);

			// Update UI
			setImageUrl(url);

			// Set container width and height depending on the image aspect ratio
			const ar = image.width / image.height;
			const [cw, ch] = ar > 720 / 480 ? [720, 720 / ar] : [480 * ar, 480];
			setContainerStyle({
				width: `${cw}px`,
				height: `${ch}px`,
				backgroundImage: `url(${url})`,
			});

			setStatus("Analysing...");

			// Preprocess image
			const { pixel_values } = await processorRef.current(image);

			// Predict alpha matte
			const { output } = await modelRef.current({ input: pixel_values });

			// Resize mask back to original size
			const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(
				image.width,
				image.height,
			);
			image.putAlpha(mask);

			// Update canvas
			if (canvasRef.current) {
				canvasRef.current.width = image.width;
				canvasRef.current.height = image.height;
				const ctx = canvasRef.current.getContext("2d");
				if (ctx) {
					ctx.drawImage(image.toCanvas(), 0, 0);
				}
			}

			// Update container style
			setContainerStyle((prev) => ({
				...prev,
				backgroundImage: "none",
				background: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURb+/v////5nD/3QAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==")`,
			}));

			setStatus("Done!");
		} catch (error) {
			console.error("Failed to process image:", error);
			setStatus("Failed to process image. Please try again.");
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-8 text-center">
			<h1 className="text-4xl font-bold mb-2">
				Background Removal w/{" "}
				<a
					href="https://github.com/huggingface/transformers.js"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-500 hover:text-blue-600"
				>
					🤗 Transformers.js
				</a>
			</h1>

			<h4 className="text-xl mb-8">
				Runs locally in your browser, powered by the{" "}
				<a
					href="https://huggingface.co/briaai/RMBG-1.4"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-500 hover:text-blue-600"
				>
					RMBG V1.4 model
				</a>{" "}
				from{" "}
				<a
					href="https://bria.ai/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-500 hover:text-blue-600"
				>
					BRIA AI
				</a>
			</h4>

			<div
				id="container"
				className="mx-auto mb-4 relative bg-cover bg-center cursor-pointer"
				style={containerStyle}
				onClick={handleUploadClick}
				onKeyPress={handleUploadKeyPress}
				role="button"
				tabIndex={0}
			>
				{!imageUrl && (
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
						<svg
							width="25"
							height="25"
							viewBox="0 0 25 25"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="mb-2"
							aria-label="Upload icon"
							role="img"
						>
							<path
								fill="currentColor"
								d="M3.5 24.3a3 3 0 0 1-1.9-.8c-.5-.5-.8-1.2-.8-1.9V2.9c0-.7.3-1.3.8-1.9.6-.5 1.2-.7 2-.7h18.6c.7 0 1.3.2 1.9.7.5.6.7 1.2.7 2v18.6c0 .7-.2 1.4-.7 1.9a3 3 0 0 1-2 .8H3.6Zm0-2.7h18.7V2.9H3.5v18.7Zm2.7-2.7h13.3c.3 0 .5 0 .6-.3v-.7l-3.7-5a.6.6 0 0 0-.6-.2c-.2 0-.4 0-.5.3l-3.5 4.6-2.4-3.3a.6.6 0 0 0-.6-.3c-.2 0-.4.1-.5.3l-2.7 3.6c-.1.2-.2.4 0 .7.1.2.3.3.6.3Z"
							/>
						</svg>
						<span className="text-lg">Click to upload image</span>
						<button
							type="button"
							className="text-sm text-blue-500 hover:text-blue-600"
							onClick={handleExampleClick}
							onKeyPress={handleExampleKeyPress}
						>
							(or try example)
						</button>
					</div>
				)}
				<canvas ref={canvasRef} className="w-full h-full" />
			</div>

			<div className="text-lg font-medium">{status}</div>

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
				aria-label="Upload image"
				id="file-upload"
			/>
		</div>
	);
}

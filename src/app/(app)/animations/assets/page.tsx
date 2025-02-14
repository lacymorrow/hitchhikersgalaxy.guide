"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { AssetGallery } from "../components/assets/asset-gallery";
import { AssetPreview } from "../components/assets/asset-preview";
import { AssetUpload } from "../components/assets/asset-upload";
import { useAssetStore } from "../store/asset-store";

// Demo data
const demoAssets = [
	{
		id: uuidv4(),
		name: "Logo Dark",
		type: "image" as const,
		url: "https://via.placeholder.com/512",
		thumbnailUrl: "https://via.placeholder.com/512",
		metadata: {
			size: 1024 * 50, // 50KB
			dimensions: {
				width: 512,
				height: 512,
			},
			format: "png",
		},
		tags: ["logo", "brand", "dark"],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: uuidv4(),
		name: "Brand Video",
		type: "video" as const,
		url: "https://www.w3schools.com/html/mov_bbb.mp4",
		thumbnailUrl: "https://via.placeholder.com/512",
		metadata: {
			size: 1024 * 1024 * 5, // 5MB
			duration: 10,
			dimensions: {
				width: 1920,
				height: 1080,
			},
			format: "mp4",
		},
		tags: ["video", "brand", "hero"],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: uuidv4(),
		name: "Background Music",
		type: "audio" as const,
		url: "https://www.w3schools.com/html/horse.mp3",
		metadata: {
			size: 1024 * 500, // 500KB
			duration: 30,
			format: "mp3",
		},
		tags: ["audio", "background", "music"],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: uuidv4(),
		name: "Brand Font",
		type: "font" as const,
		url: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
		metadata: {
			size: 1024 * 100, // 100KB
			format: "woff2",
		},
		tags: ["font", "brand", "typography"],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: uuidv4(),
		name: "Primary Color",
		type: "color" as const,
		url: "#0099ff",
		tags: ["color", "brand", "primary"],
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

export default function AssetsPage() {
	const { setAssets } = useAssetStore();

	// Initialize with demo data
	useEffect(() => {
		setAssets(demoAssets);
	}, [setAssets]);

	return (
		<div className="container mx-auto space-y-8 py-8">
			<div className="flex items-center justify-between">
				<h1 className="text-4xl font-bold">Assets</h1>
				<AssetUpload />
			</div>

			<AssetGallery />
			<AssetPreview />
		</div>
	);
}

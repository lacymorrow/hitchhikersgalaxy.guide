import { create } from "zustand";
import type { AnimationTemplate, Asset, AssetCollection } from "../types";

interface AssetStore {
	assets: Asset[];
	collections: AssetCollection[];
	templates: AnimationTemplate[];
	selectedAsset: Asset | null;
	selectedCollection: AssetCollection | null;
	// Asset operations
	setAssets: (assets: Asset[]) => void;
	addAsset: (asset: Asset) => void;
	updateAsset: (asset: Asset) => void;
	deleteAsset: (assetId: string) => void;
	selectAsset: (asset: Asset | null) => void;
	// Collection operations
	addCollection: (collection: AssetCollection) => void;
	updateCollection: (collection: AssetCollection) => void;
	deleteCollection: (collectionId: string) => void;
	selectCollection: (collection: AssetCollection | null) => void;
	addAssetToCollection: (assetId: string, collectionId: string) => void;
	removeAssetFromCollection: (assetId: string, collectionId: string) => void;
	// Template operations
	addTemplate: (template: AnimationTemplate) => void;
	updateTemplate: (template: AnimationTemplate) => void;
	deleteTemplate: (templateId: string) => void;
	// Queries
	getAssetsByType: (type: Asset["type"]) => Asset[];
	getAssetsByTags: (tags: string[]) => Asset[];
	getCollectionAssets: (collectionId: string) => Asset[];
	searchAssets: (query: string) => Asset[];
}

export const useAssetStore = create<AssetStore>()((set, get) => ({
	assets: [],
	collections: [],
	templates: [],
	selectedAsset: null,
	selectedCollection: null,

	// Asset operations
	setAssets: (assets) => set({ assets }),
	addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
	updateAsset: (asset) =>
		set((state) => ({
			assets: state.assets.map((a) => (a.id === asset.id ? asset : a)),
		})),
	deleteAsset: (assetId) =>
		set((state) => ({
			assets: state.assets.filter((a) => a.id !== assetId),
			collections: state.collections.map((c) => ({
				...c,
				assets: c.assets.filter((id) => id !== assetId),
			})),
		})),
	selectAsset: (asset) => set({ selectedAsset: asset }),

	// Collection operations
	addCollection: (collection) =>
		set((state) => ({
			collections: [...state.collections, collection],
		})),
	updateCollection: (collection) =>
		set((state) => ({
			collections: state.collections.map((c) =>
				c.id === collection.id ? collection : c,
			),
		})),
	deleteCollection: (collectionId) =>
		set((state) => ({
			collections: state.collections.filter((c) => c.id !== collectionId),
		})),
	selectCollection: (collection) => set({ selectedCollection: collection }),
	addAssetToCollection: (assetId, collectionId) =>
		set((state) => ({
			collections: state.collections.map((c) =>
				c.id === collectionId && !c.assets.includes(assetId)
					? { ...c, assets: [...c.assets, assetId] }
					: c,
			),
		})),
	removeAssetFromCollection: (assetId, collectionId) =>
		set((state) => ({
			collections: state.collections.map((c) =>
				c.id === collectionId
					? { ...c, assets: c.assets.filter((id) => id !== assetId) }
					: c,
			),
		})),

	// Template operations
	addTemplate: (template) =>
		set((state) => ({
			templates: [...state.templates, template],
		})),
	updateTemplate: (template) =>
		set((state) => ({
			templates: state.templates.map((t) =>
				t.id === template.id ? template : t,
			),
		})),
	deleteTemplate: (templateId) =>
		set((state) => ({
			templates: state.templates.filter((t) => t.id !== templateId),
		})),

	// Queries
	getAssetsByType: (type) => get().assets.filter((a) => a.type === type),
	getAssetsByTags: (tags) =>
		get().assets.filter((a) => tags.some((tag) => a.tags.includes(tag))),
	getCollectionAssets: (collectionId) => {
		const collection = get().collections.find((c) => c.id === collectionId);
		return collection
			? get().assets.filter((a) => collection.assets.includes(a.id))
			: [];
	},
	searchAssets: (query) => {
		const lowercaseQuery = query.toLowerCase();
		return get().assets.filter(
			(a) =>
				a.name.toLowerCase().includes(lowercaseQuery) ||
				a.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
		);
	},
}));

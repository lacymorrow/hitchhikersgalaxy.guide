import { create } from "zustand";
import { type AnimationMetadata } from "../types";

interface AnimationState {
    animations: AnimationMetadata[];
    selectedAnimation: AnimationMetadata | null;
    favorites: string[]; // Animation IDs
    tags: Record<string, string[]>; // Animation ID -> Tags
    setAnimations: (animations: AnimationMetadata[]) => void;
    selectAnimation: (animation: AnimationMetadata) => void;
    toggleFavorite: (animationId: string) => void;
    addTag: (animationId: string, tag: string) => void;
    removeTag: (animationId: string, tag: string) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
    animations: [],
    selectedAnimation: null,
    favorites: [],
    tags: {},
    setAnimations: (animations) => set({ animations }),
    selectAnimation: (animation) => set({ selectedAnimation: animation }),
    toggleFavorite: (animationId) =>
        set((state) => ({
            favorites: state.favorites.includes(animationId)
                ? state.favorites.filter((id) => id !== animationId)
                : [...state.favorites, animationId],
        })),
    addTag: (animationId, tag) =>
        set((state) => ({
            tags: {
                ...state.tags,
                [animationId]: [...(state.tags[animationId] || []), tag],
            },
        })),
    removeTag: (animationId, tag) =>
        set((state) => ({
            tags: {
                ...state.tags,
                [animationId]: (state.tags[animationId] || []).filter((t) => t !== tag),
            },
        })),
}));

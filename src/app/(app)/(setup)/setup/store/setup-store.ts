import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SetupState {
	currentStep: number;
	repoUrl: string | null;
	deploymentId: string | null;
	deploymentUrl: string | null;
	isComplete: boolean;
	setCurrentStep: (step: number) => void;
	setRepoUrl: (url: string | null) => void;
	setDeploymentId: (id: string | null) => void;
	setDeploymentUrl: (url: string | null) => void;
	markComplete: () => void;
	reset: () => void;
}

const initialState = {
	currentStep: 0,
	repoUrl: null,
	deploymentId: null,
	deploymentUrl: null,
	isComplete: false,
};

export const useSetupStore = create<SetupState>()(
	persist(
		(set) => ({
			...initialState,
			setCurrentStep: (step) => set({ currentStep: step }),
			setRepoUrl: (url) => set({ repoUrl: url }),
			setDeploymentId: (id) => set({ deploymentId: id }),
			setDeploymentUrl: (url) => set({ deploymentUrl: url }),
			markComplete: () => set({ isComplete: true }),
			reset: () => set(initialState),
		}),
		{
			name: "setup-store",
		}
	)
);

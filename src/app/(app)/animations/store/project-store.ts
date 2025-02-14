import { create, type GetState, type SetState } from "zustand";
import { type AnimationProject, type RenderJob } from "../types";

interface ProjectStore {
    projects: AnimationProject[];
    selectedProject: AnimationProject | null;
    renderJobs: RenderJob[];
    setProjects: (projects: AnimationProject[]) => void;
    selectProject: (project: AnimationProject | null) => void;
    addProject: (project: AnimationProject) => void;
    updateProject: (project: AnimationProject) => void;
    deleteProject: (projectId: string) => void;
    addRenderJob: (job: RenderJob) => void;
    updateRenderJob: (job: RenderJob) => void;
    getRenderJobs: (projectId: string) => RenderJob[];
}

export const useProjectStore = create<ProjectStore>(
    (set: SetState<ProjectStore>, get: GetState<ProjectStore>) => ({
        projects: [],
        selectedProject: null,
        renderJobs: [],
        setProjects: (projects: AnimationProject[]) => set({ projects }),
        selectProject: (project: AnimationProject | null) =>
            set({ selectedProject: project }),
        addProject: (project: AnimationProject) =>
            set((state) => ({ projects: [...state.projects, project] })),
        updateProject: (project: AnimationProject) =>
            set((state) => ({
                projects: state.projects.map((p) =>
                    p.id === project.id ? project : p,
                ),
            })),
        deleteProject: (projectId: string) =>
            set((state) => ({
                projects: state.projects.filter((p) => p.id !== projectId),
            })),
        addRenderJob: (job: RenderJob) =>
            set((state) => ({ renderJobs: [...state.renderJobs, job] })),
        updateRenderJob: (job: RenderJob) =>
            set((state) => ({
                renderJobs: state.renderJobs.map((j) => (j.id === job.id ? job : j)),
            })),
        getRenderJobs: (projectId: string) =>
            get().renderJobs.filter((job) =>
                get()
                    .projects.find((p) => p.id === projectId)
                    ?.animations.includes(job.animationId),
            ),
    }),
);

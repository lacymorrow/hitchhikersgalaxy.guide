import type { PretrainedModelOptions } from "@huggingface/transformers";

/**
 * Message protocol shared by `ai-smollm-webgpu.tsx` (main thread) and `worker.ts`.
 * Both sides import from here so a change to one cannot silently drift from the other.
 */

/** Chat turn as sent to the tokenizer's chat template. */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Transformers.js does not re-export these from its root, so derive them from an exported option type. */
export type ProgressCallback = NonNullable<PretrainedModelOptions["progress_callback"]>;
export type ProgressInfo = Parameters<ProgressCallback>[0];

/** One row in the model-loading progress list. `progress` and `total` arrive with the first "progress" event. */
export interface ProgressItem {
  file: string;
  name: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

/** Main thread to worker. */
export type WorkerRequest =
  | { type: "check" }
  | { type: "load" }
  | { type: "generate"; data: ChatMessage[] }
  | { type: "interrupt" }
  | { type: "reset" };

/** Worker to main thread. Loading progress is forwarded from Transformers.js unchanged. */
export type WorkerResponse =
  | ProgressInfo
  | { status: "loading"; data: string }
  | { status: "error"; data: string }
  | { status: "ready" }
  | { status: "start" }
  | { status: "update"; output: string; tps: number | undefined; numTokens: number }
  | { status: "complete"; output: string[] };

/** MathJax v3 is loaded from a CDN `<Script>`; the page sets its config before the script runs. */
export interface MathJaxGlobal {
  tex?: { inlineMath?: [string, string][] };
  svg?: { fontCache?: string };
  typeset?: (elements?: Element[]) => void;
}

declare global {
  interface Window {
    MathJax?: MathJaxGlobal;
    /** Optional bridge that `ai-demo.tsx` calls when present. Nothing in this item registers it. */
    aiModel?: { generate: (prompt: string) => Promise<string> };
  }
}

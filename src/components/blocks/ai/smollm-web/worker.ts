import {
  AutoModelForCausalLM,
  AutoTokenizer,
  InterruptableStoppingCriteria,
  type ModelOutput,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  StoppingCriteriaList,
  type Tensor,
  TextStreamer,
} from "@huggingface/transformers";
import type { ChatMessage, ProgressCallback, WorkerRequest, WorkerResponse } from "./types";

const MODEL_ID = "HuggingFaceTB/SmolLM2-1.7B-Instruct";

const post = (message: WorkerResponse) => self.postMessage(message);

/** Tokenized prompt as `apply_chat_template` returns it with `return_dict: true`. */
interface BatchEncoding {
  input_ids: Tensor;
  attention_mask: Tensor;
}

/** `generate()` is typed as `ModelOutput | Tensor`; with `return_dict_in_generate` it is this shape. */
interface GenerateOutput {
  sequences: Tensor;
  past_key_values: unknown;
}

/** The typed `generate()` parameters omit the `...kwargs` the runtime accepts. */
type GenerateOptions = Parameters<PreTrainedModel["generate"]>[0] &
  Partial<BatchEncoding> & {
    max_new_tokens?: number;
    return_dict_in_generate?: boolean;
  };

function isBatchEncoding(value: unknown): value is BatchEncoding {
  return (
    typeof value === "object" && value !== null && "input_ids" in value && "attention_mask" in value
  );
}

function isGenerateOutput(value: ModelOutput | Tensor): value is ModelOutput & GenerateOutput {
  return "sequences" in value;
}

/** Feature detection for WebGPU. Reports through the error channel so the UI can show it. */
async function check() {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    const adapter = await gpu?.requestAdapter();
    if (!adapter) {
      throw new Error("WebGPU is not supported (no adapter found)");
    }
  } catch (e) {
    post({ status: "error", data: String(e) });
  }
}

/** Lazy singletons so the model and tokenizer load once per worker. */
let tokenizerPromise: Promise<PreTrainedTokenizer> | null = null;
let modelPromise: Promise<PreTrainedModel> | null = null;

function getInstance(
  progress_callback?: ProgressCallback
): Promise<[PreTrainedTokenizer, PreTrainedModel]> {
  tokenizerPromise ??= AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback });
  modelPromise ??= AutoModelForCausalLM.from_pretrained(MODEL_ID, {
    dtype: "q4f16",
    device: "webgpu",
    progress_callback,
  });
  return Promise.all([tokenizerPromise, modelPromise]);
}

const interruptable = new InterruptableStoppingCriteria();
const stopping_criteria = new StoppingCriteriaList();
stopping_criteria.push(interruptable);

async function generate(messages: ChatMessage[]) {
  const [tokenizer, model] = await getInstance();

  const inputs = tokenizer.apply_chat_template(messages, {
    add_generation_prompt: true,
    return_dict: true,
  });
  if (!isBatchEncoding(inputs)) {
    post({ status: "error", data: "Tokenizer did not return input_ids and attention_mask" });
    return;
  }

  let startTime: number | undefined;
  let numTokens = 0;
  let tps: number | undefined;
  const token_callback_function = () => {
    startTime ??= performance.now();
    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
    }
  };
  const callback_function = (output: string) => {
    post({ status: "update", output, tps, numTokens });
  };

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function,
    token_callback_function,
  });

  post({ status: "start" });

  const options: GenerateOptions = {
    ...inputs,
    max_new_tokens: 1024,
    streamer,
    stopping_criteria,
    return_dict_in_generate: true,
  };
  const output = await model.generate(options);
  if (!isGenerateOutput(output)) {
    post({ status: "error", data: "Model did not return generated sequences" });
    return;
  }

  const decoded = tokenizer.batch_decode(output.sequences, { skip_special_tokens: true });
  post({ status: "complete", output: decoded });
}

async function load() {
  post({ status: "loading", data: "Loading model..." });

  // Forward Transformers.js progress events to the UI as they arrive.
  const [tokenizer, model] = await getInstance((info) => post(info));

  post({ status: "loading", data: "Compiling shaders and warming up model..." });

  // Run the model once on a trivial input so the shaders compile before the first real prompt.
  const warmup = tokenizer("a") as BatchEncoding;
  const warmupOptions: GenerateOptions = { ...warmup, max_new_tokens: 1 };
  await model.generate(warmupOptions);
  post({ status: "ready" });
}

self.addEventListener("message", (e: MessageEvent<WorkerRequest>) => {
  const request = e.data;
  switch (request.type) {
    case "check":
      void check();
      break;
    case "load":
      void load();
      break;
    case "generate":
      interruptable.reset();
      void generate(request.data);
      break;
    case "interrupt":
      interruptable.interrupt();
      break;
    case "reset":
      interruptable.reset();
      break;
  }
});

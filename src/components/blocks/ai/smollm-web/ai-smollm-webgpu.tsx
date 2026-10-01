"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import Chat from "./_components/Chat";
import ArrowRightIcon from "./_components/icons/ArrowRightIcon";
import StopIcon from "./_components/icons/StopIcon";
import Progress from "./_components/Progress";
import type { ChatMessage, ProgressItem, WorkerRequest, WorkerResponse } from "./types";

const STICKY_SCROLL_THRESHOLD = 120;
const EXAMPLES = [
  "Give me some tips to improve my time management skills.",
  "What is the difference between AI and ML?",
  "Write python code to compute the nth fibonacci number.",
];

type LoadStatus = "loading" | "ready" | null;

interface AISmollmWebGPUProps {
  /** Called once the model has loaded and warmed up. */
  onReady?: () => void;
}

export const AISmollmWebGPU = ({ onReady }: AISmollmWebGPUProps) => {
  const [isWebGPUAvailable, setIsWebGPUAvailable] = useState<boolean | null>(null);

  const worker = useRef<Worker | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Model loading and progress
  const [status, setStatus] = useState<LoadStatus>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Inputs and outputs
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tps, setTps] = useState<number | null>(null);
  const [numTokens, setNumTokens] = useState<number | null>(null);

  const send = useCallback((request: WorkerRequest) => {
    worker.current?.postMessage(request);
  }, []);

  // Check for WebGPU support on mount
  useEffect(() => {
    const checkWebGPU = async () => {
      try {
        const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } })
          .gpu;
        if (!gpu) {
          setIsWebGPUAvailable(false);
          return;
        }
        await gpu.requestAdapter();
        setIsWebGPUAvailable(true);
      } catch (_e) {
        setIsWebGPUAvailable(false);
      }
    };

    void checkWebGPU();
  }, []);

  const onEnter = useCallback((message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setTps(null);
    setIsRunning(true);
    setInput("");
  }, []);

  const onInterrupt = useCallback(() => {
    send({ type: "interrupt" });
  }, [send]);

  // Resize textarea effect
  useEffect(() => {
    function resizeTextarea() {
      const target = textareaRef.current;
      if (!target) return;
      target.style.height = "auto";
      const newHeight = Math.min(Math.max(target.scrollHeight, 24), 200);
      target.style.height = `${newHeight}px`;
    }
    resizeTextarea();
  }, []);

  // Create the worker on mount and wire its messages into state.
  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
      worker.current.postMessage({ type: "check" } satisfies WorkerRequest);
    }
    const current = worker.current;

    const onMessageReceived = (e: MessageEvent<WorkerResponse>) => {
      const data = e.data;
      switch (data.status) {
        case "loading":
          // Model file start load: add a new progress item to the list.
          setStatus("loading");
          setLoadingMessage(data.data);
          break;

        case "initiate":
          setProgressItems((prev) => [...prev, { file: data.file, name: data.name }]);
          break;

        case "progress":
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => (item.file === data.file ? { ...item, ...data } : item))
          );
          break;

        case "done":
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) => prev.filter((item) => item.file !== data.file));
          break;

        case "ready":
          // Pipeline ready: the worker is ready to accept messages.
          setStatus("ready");
          onReady?.();
          break;

        case "start":
          // Start generation
          setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
          break;

        case "update": {
          // Generation update: append the new text to the last assistant message.
          setTps(data.tps ?? null);
          setNumTokens(data.numTokens);
          setMessages((prev) => {
            const last = prev.at(-1);
            if (!last) return prev;
            return [...prev.slice(0, -1), { ...last, content: last.content + data.output }];
          });
          break;
        }

        case "complete":
          // Generation complete: re-enable the "Generate" button
          setIsRunning(false);
          break;

        case "error":
          setError(data.data);
          break;

        default:
          // "download" and other Transformers.js progress events need no UI.
          break;
      }
    };

    const onErrorReceived = (e: ErrorEvent) => {
      console.error("Worker error:", e);
    };

    current.addEventListener("message", onMessageReceived);
    current.addEventListener("error", onErrorReceived);

    return () => {
      current.removeEventListener("message", onMessageReceived);
      current.removeEventListener("error", onErrorReceived);
    };
  }, [onReady]);

  // Send the messages to the worker thread whenever the `messages` state changes.
  useEffect(() => {
    if (messages.filter((x) => x.role === "user").length === 0) {
      // No user messages yet: do nothing.
      return;
    }
    if (messages.at(-1)?.role === "assistant") {
      // Do not update if the last message is from the assistant
      return;
    }
    setTps(null);
    send({ type: "generate", data: messages });
  }, [messages, send]);

  // Keep the newest output in view while it streams, unless the reader scrolled up.
  useEffect(() => {
    const element = chatContainerRef.current;
    if (!element || !isRunning || messages.length === 0) return;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < STICKY_SCROLL_THRESHOLD) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, isRunning]);

  // Show loading state while checking WebGPU
  if (isWebGPUAvailable === null) {
    return (
      <div className="fixed z-10 flex h-screen w-screen items-center justify-center bg-black/[92%] text-center text-2xl font-semibold text-white">
        Checking WebGPU support...
      </div>
    );
  }

  // Show not supported message
  if (!isWebGPUAvailable) {
    return (
      <div className="fixed z-10 flex h-screen w-screen items-center justify-center bg-black/[92%] text-center text-2xl font-semibold text-white">
        WebGPU is not supported
        <br />
        by this browser :&#40;
      </div>
    );
  }

  return (
    <div className="items mx-auto flex h-screen flex-col justify-end bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {status === null && messages.length === 0 && (
        <div className="relative flex h-full scrollbar-thin flex-col items-center justify-center overflow-auto">
          <div className="mb-1 flex max-w-[320px] flex-col items-center text-center">
            <img src="logo.png" width="80%" height="auto" alt="SmolLM2 Logo" className="block" />
            <h1 className="mb-1 text-4xl font-bold">SmolLM2 WebGPU</h1>
            <h2 className="font-semibold">
              A blazingly fast and powerful AI chatbot that runs locally in your browser.
            </h2>
          </div>

          <div className="flex flex-col items-center px-4">
            <p className="mb-4 max-w-[480px]">
              <br />
              You are about to load{" "}
              <a
                href="https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                SmolLM2-1.7B-Instruct
              </a>
              , a 1.7B parameter LLM optimized for in-browser inference. Everything runs entirely in
              your browser with{" "}
              <a
                href="https://huggingface.co/docs/transformers.js"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                🤗&nbsp;Transformers.js
              </a>{" "}
              and ONNX Runtime Web, meaning no data is sent to a server. Once loaded, it can even be
              used offline. The source code for the demo is available on{" "}
              <a
                href="https://github.com/huggingface/transformers.js-examples/tree/main/smollm-webgpu"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                GitHub
              </a>
              .
            </p>

            {error && (
              <div className="mb-2 text-center text-red-500">
                <p className="mb-1">Unable to load model due to the following error:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="button"
              className="rounded-lg border bg-blue-400 px-4 py-2 text-white select-none hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-100"
              onClick={() => {
                send({ type: "load" });
                setStatus("loading");
              }}
              disabled={status !== null || error !== null}
            >
              Load model
            </button>
          </div>
        </div>
      )}
      {status === "loading" && (
        <div className="bottom-0 mx-auto mt-auto w-full max-w-[500px] p-4 text-left">
          <p className="mb-1 text-center">{loadingMessage}</p>
          {progressItems.map(({ file, progress, total }) => (
            <Progress key={file} text={file} percentage={progress} total={total} />
          ))}
        </div>
      )}

      {status === "ready" && (
        <div
          ref={chatContainerRef}
          className="flex h-full w-full scrollbar-thin flex-col items-center overflow-y-auto"
        >
          <Chat messages={messages} />
          {messages.length === 0 && (
            <div>
              {EXAMPLES.map((msg) => (
                <button
                  type="button"
                  key={msg}
                  className="m-1 block w-full cursor-pointer rounded-md border bg-gray-100 p-2 text-left dark:border-gray-600 dark:bg-gray-700"
                  onClick={() => onEnter(msg)}
                >
                  {msg}
                </button>
              ))}
            </div>
          )}
          <p className="min-h-6 text-center text-sm text-gray-500 dark:text-gray-300">
            {tps && messages.length > 0 && (
              <>
                {!isRunning && (
                  <span>
                    Generated {numTokens ?? 0} tokens in {((numTokens ?? 0) / tps).toFixed(2)}{" "}
                    seconds&nbsp;&#40;
                  </span>
                )}
                <span className="mr-1 text-center font-medium text-black dark:text-white">
                  {tps.toFixed(2)}
                </span>
                <span className="text-gray-500 dark:text-gray-300">tokens/second</span>
                {!isRunning && (
                  <>
                    <span className="mr-1">&#41;.</span>
                    <button
                      type="button"
                      className="cursor-pointer underline"
                      onClick={() => {
                        send({ type: "reset" });
                        setMessages([]);
                      }}
                    >
                      Reset
                    </button>
                  </>
                )}
              </>
            )}
          </p>
        </div>
      )}

      <div className="relative mx-auto mt-2 mb-3 flex max-h-[200px] w-[600px] max-w-[80%] rounded-lg border dark:bg-gray-700">
        <textarea
          ref={textareaRef}
          className="w-[550px] resize-none scrollbar-thin rounded-lg border-none bg-transparent px-3 py-4 text-gray-800 placeholder-gray-500 outline-hidden disabled:cursor-not-allowed disabled:text-gray-400 disabled:placeholder-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
          placeholder="Type your message..."
          value={input}
          disabled={status !== "ready"}
          title={status === "ready" ? "Model is ready" : "Model not loaded yet"}
          onKeyDown={(e) => {
            if (input.length > 0 && !isRunning && e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onEnter(input);
            }
          }}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
        />
        {isRunning ? (
          <button
            type="button"
            className="cursor-pointer"
            onClick={onInterrupt}
            aria-label="Stop generation"
          >
            <StopIcon className="absolute right-3 bottom-3 h-8 w-8 rounded-md p-1 text-gray-800 dark:text-gray-100" />
          </button>
        ) : input.length > 0 ? (
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => onEnter(input)}
            aria-label="Send message"
          >
            <ArrowRightIcon className="absolute right-3 bottom-3 h-8 w-8 rounded-md bg-gray-800 p-1 text-white dark:bg-gray-100 dark:text-black" />
          </button>
        ) : (
          <div aria-hidden="true">
            <ArrowRightIcon className="absolute right-3 bottom-3 h-8 w-8 rounded-md bg-gray-200 p-1 text-gray-50 dark:bg-gray-600 dark:text-gray-800" />
          </div>
        )}
      </div>

      <p className="mb-3 text-center text-xs text-gray-400">
        Disclaimer: Generated content may be inaccurate or false.
      </p>
    </div>
  );
};

// @ts-nocheck

"use client";
import { useCallback, useEffect, useRef, useState } from "react";

import Chat from "./_components/Chat";
import ArrowRightIcon from "./_components/icons/ArrowRightIcon";
import StopIcon from "./_components/icons/StopIcon";
import Progress from "./_components/Progress";

const _IS_WEBGPU_AVAILABLE = !!navigator?.gpu;
const STICKY_SCROLL_THRESHOLD = 120;
const EXAMPLES = [
  "Give me some tips to improve my time management skills.",
  "What is the difference between AI and ML?",
  "Write python code to compute the nth fibonacci number.",
];

export const AISmollmWebGPU = () => {
  // Add state for WebGPU availability
  const [isWebGPUAvailable, setIsWebGPUAvailable] = useState<boolean | null>(null);

  // Create a reference to the worker object.
  const worker = useRef(null);

  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Model loading and progress
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressItems, setProgressItems] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Inputs and outputs
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [tps, setTps] = useState(null);
  const [numTokens, setNumTokens] = useState(null);

  // Check for WebGPU support on mount
  useEffect(() => {
    const checkWebGPU = async () => {
      try {
        const gpu = navigator?.gpu;
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

    checkWebGPU();
  }, []);

  const onEnter = useCallback((message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setTps(null);
    setIsRunning(true);
    setInput("");
  }, []);

  const onInterrupt = useCallback(() => {
    worker.current?.postMessage({ type: "interrupt" });
  }, []);

  // Resize textarea effect
  useEffect(() => {
    function resizeTextarea() {
      if (!textareaRef.current) return;
      const target = textareaRef.current;
      target.style.height = "auto";
      const newHeight = Math.min(Math.max(target.scrollHeight, 24), 200);
      target.style.height = `${newHeight}px`;
    }
    resizeTextarea();
  }, []);

  // We use the `useEffect` hook to setup the worker as soon as the `App` component is mounted.
  useEffect(() => {
    // Create the worker if it does not yet exist.
    if (!worker.current) {
      worker.current = new Worker(new URL("./worker.js", import.meta.url));
      worker.current.postMessage({ type: "check" }); // Do a feature check
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case "loading":
          // Model file start load: add a new progress item to the list.
          setStatus("loading");
          setLoadingMessage(e.data.data);
          break;

        case "initiate":
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, ...e.data };
              }
              return item;
            })
          );
          break;

        case "done":
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) => prev.filter((item) => item.file !== e.data.file));
          break;

        case "ready":
          // Pipeline ready: the worker is ready to accept messages.
          setStatus("ready");
          break;

        case "start":
          {
            // Start generation
            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
          }
          break;

        case "update":
          {
            // Generation update: update the output text.
            // Parse messages
            const { output, tps, numTokens } = e.data;
            setTps(tps);
            setNumTokens(numTokens);
            setMessages((prev) => {
              const cloned = [...prev];
              const last = cloned.at(-1);
              cloned[cloned.length - 1] = {
                ...last,
                content: last.content + output,
              };
              return cloned;
            });
          }
          break;

        case "complete":
          // Generation complete: re-enable the "Generate" button
          setIsRunning(false);
          break;

        case "error":
          setError(e.data.data);
          break;
      }
    };

    const onErrorReceived = (e) => {
      console.error("Worker error:", e);
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);
    worker.current.addEventListener("error", onErrorReceived);

    // Define a cleanup function for when the component is unmounted.
    return () => {
      worker.current.removeEventListener("message", onMessageReceived);
      worker.current.removeEventListener("error", onErrorReceived);
    };
  }, []);

  // Send the messages to the worker thread whenever the `messages` state changes.
  useEffect(() => {
    if (messages.filter((x) => x.role === "user").length === 0) {
      // No user messages yet: do nothing.
      return;
    }
    if (messages.at(-1).role === "assistant") {
      // Do not update if the last message is from the assistant
      return;
    }
    setTps(null);
    worker.current.postMessage({ type: "generate", data: messages });
  }, [messages, isRunning]);

  useEffect(() => {
    if (!chatContainerRef.current || !isRunning) return;
    const element = chatContainerRef.current;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < STICKY_SCROLL_THRESHOLD) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, isRunning]);

  // Show loading state while checking WebGPU
  if (isWebGPUAvailable === null) {
    return (
      <div className="fixed z-10 flex h-screen w-screen items-center justify-center bg-black bg-opacity-[92%] text-center text-2xl font-semibold text-white">
        Checking WebGPU support...
      </div>
    );
  }

  // Show not supported message
  if (!isWebGPUAvailable) {
    return (
      <div className="fixed z-10 flex h-screen w-screen items-center justify-center bg-black bg-opacity-[92%] text-center text-2xl font-semibold text-white">
        WebGPU is not supported
        <br />
        by this browser :&#40;
      </div>
    );
  }

  return (
    <div className="items mx-auto flex h-screen flex-col justify-end bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      {status === null && messages.length === 0 && (
        <div className="scrollbar-thin relative flex h-full flex-col items-center justify-center overflow-auto">
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
              className="select-none rounded-lg border bg-blue-400 px-4 py-2 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-100"
              onClick={() => {
                worker.current.postMessage({ type: "load" });
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
          {progressItems.map(({ file, progress, total }, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
            <Progress key={i} text={file} percentage={progress} total={total} />
          ))}
        </div>
      )}

      {status === "ready" && (
        <div
          ref={chatContainerRef}
          className="scrollbar-thin flex h-full w-full flex-col items-center overflow-y-auto"
        >
          <Chat messages={messages} />
          {messages.length === 0 && (
            <div>
              {EXAMPLES.map((msg, i) => (
                // biome-ignore lint/a11y/noStaticElementInteractions: decorative/UI hover interaction, not primary action
                // biome-ignore lint/a11y/useKeyWithClickEvents: decorative click target, no keyboard handler required
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: decorative/static array, key is stable index
                  key={i}
                  className="m-1 cursor-pointer rounded-md border bg-gray-100 p-2 dark:border-gray-600 dark:bg-gray-700"
                  onClick={() => onEnter(msg)}
                >
                  {msg}
                </div>
              ))}
            </div>
          )}
          <p className="min-h-6 text-center text-sm text-gray-500 dark:text-gray-300">
            {tps && messages.length > 0 && (
              <>
                {!isRunning && (
                  <span>
                    Generated {numTokens} tokens in {(numTokens / tps).toFixed(2)}{" "}
                    seconds&nbsp;&#40;
                  </span>
                )}
                {
                  <>
                    <span className="mr-1 text-center font-medium text-black dark:text-white">
                      {tps.toFixed(2)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-300">tokens/second</span>
                  </>
                }
                {!isRunning && (
                  <>
                    <span className="mr-1">&#41;.</span>
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: decorative/UI hover interaction, not primary action */}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: decorative click target, no keyboard handler required */}
                    <span
                      className="cursor-pointer underline"
                      onClick={() => {
                        worker.current.postMessage({ type: "reset" });
                        setMessages([]);
                      }}
                    >
                      Reset
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
      )}

      <div className="relative mx-auto mb-3 mt-2 flex max-h-[200px] w-[600px] max-w-[80%] rounded-lg border dark:bg-gray-700">
        <textarea
          ref={textareaRef}
          className="scrollbar-thin w-[550px] resize-none rounded-lg border-none bg-transparent px-3 py-4 text-gray-800 placeholder-gray-500 outline-none disabled:cursor-not-allowed disabled:text-gray-400 disabled:placeholder-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onInterrupt();
              }
            }}
            aria-label="Stop generation"
          >
            <StopIcon className="absolute bottom-3 right-3 h-8 w-8 rounded-md p-1 text-gray-800 dark:text-gray-100" />
          </button>
        ) : input.length > 0 ? (
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => onEnter(input)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onEnter(input);
              }
            }}
            aria-label="Send message"
          >
            <ArrowRightIcon className="absolute bottom-3 right-3 h-8 w-8 rounded-md bg-gray-800 p-1 text-white dark:bg-gray-100 dark:text-black" />
          </button>
        ) : (
          <div aria-hidden="true">
            <ArrowRightIcon className="absolute bottom-3 right-3 h-8 w-8 rounded-md bg-gray-200 p-1 text-gray-50 dark:bg-gray-600 dark:text-gray-800" />
          </div>
        )}
      </div>

      <p className="mb-3 text-center text-xs text-gray-400">
        Disclaimer: Generated content may be inaccurate or false.
      </p>
    </div>
  );
};

// @ts-nocheck
"use client";

import dynamic from "next/dynamic";

const AIRealtimeWhisperWebGPU = dynamic(
  async () => {
    const mod = await import("./ai-realtime-whisper");
    return mod.AIRealtimeWhisperWebGPU;
  },
  { ssr: false }
);

export default function Page() {
  return <AIRealtimeWhisperWebGPU />;
}

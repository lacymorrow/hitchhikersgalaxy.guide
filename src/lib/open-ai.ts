import OpenAI from "openai";
import { env } from "@/env";

// Initialize OpenAI client only if the API key is present at runtime
// Note: avoid gating on NEXT_PUBLIC_FEATURE_OPENAI_ENABLED (build-time baked) —
// the key presence alone is the correct runtime guard.
export const openai = env?.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  : null;

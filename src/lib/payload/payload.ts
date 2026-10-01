// Todo: if payload is accessed when there is no database setup, the whole app crashes.

import type { Payload } from "payload";
import { env } from "@/env";

// Memoized client promise so repeated calls share one initialization.
let payloadClientPromise: Promise<Payload | null> | null = null;

/**
 * Get the Payload client.
 *
 * Returns null when Payload is disabled, before `@payload-config` or `payload`
 * are imported, so importers of this module do not statically pull Payload CMS
 * into their bundle. The client is memoized in a module-level promise so
 * repeated calls do not re-initialize Payload.
 */
export const getPayloadClient = async (): Promise<Payload | null> => {
  if (!env?.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
    // logger.debug("Payload not initialized: DATABASE_URL is missing or Payload is not enabled");
    return null;
  }

  if (!payloadClientPromise) {
    payloadClientPromise = (async () => {
      try {
        const [{ default: payloadConfig }, { getPayload }] = await Promise.all([
          import("@payload-config"),
          import("payload"),
        ]);

        return await getPayload({ config: payloadConfig });
      } catch (error) {
        console.warn("Payload failed to initialize", error);
        // Drop the memoized promise so a later call can retry.
        payloadClientPromise = null;
        return null;
      }
    })();
  }

  return payloadClientPromise;
};

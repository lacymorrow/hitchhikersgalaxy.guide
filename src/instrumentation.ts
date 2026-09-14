/**
 * Next.js instrumentation file
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 * WARNING: This needs to load on Node.js AND Edge runtime.
 */

import { registerOTel } from "@vercel/otel";
import { defineNodeInstrumentation } from "evlog/next/instrumentation";
import type { Instrumentation } from "next";
import { isEvlogEnabled } from "@/lib/evlog";
import { displayLaunchMessage } from "@/lib/utils/kit-launch-message";

/**
 * evlog trial (LAC-3361). defineNodeInstrumentation loads evlog via dynamic
 * import on the Node.js runtime only, so Edge bundles stay clean; the loader
 * below only ever runs when register()/onRequestError fire with the flag on.
 * The drain reuses the existing OTel pipeline (OTEL_EXPORTER_OTLP_ENDPOINT) —
 * without an endpoint, events still log locally.
 */
const evlog = defineNodeInstrumentation(async () => {
  const [{ createInstrumentation }, { createOTLPDrain }] = await Promise.all([
    import("evlog/next/instrumentation/create"),
    import("evlog/otlp"),
  ]);
  return createInstrumentation({
    service: "shipkit",
    drain: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? createOTLPDrain() : undefined,
  });
});

/**
 * Registers OpenTelemetry for observability in the application.
 * This function is called once when a new Next.js server instance is initiated.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize payment providers once on server startup
    // await import("./instrumentation-node");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // await import('./instrumentation-edge')
  }

  displayLaunchMessage();
  registerOTel({
    serviceName: "shipkit",
    // Add any additional configuration options here
  });

  if (isEvlogEnabled()) {
    await evlog.register();
  }
}

/**
 * Handles server errors and reports them to a custom observability provider.
 * This function is triggered when the Next.js server captures an error.
 *
 * @param error - The caught error with a unique digest ID.
 * @param request - Information about the request that caused the error.
 * @param context - The context in which the error occurred.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (!isEvlogEnabled()) return;
  await evlog.onRequestError(
    error as Parameters<typeof evlog.onRequestError>[0],
    request as Parameters<typeof evlog.onRequestError>[1],
    context as Parameters<typeof evlog.onRequestError>[2]
  );
};

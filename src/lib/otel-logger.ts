import { type Span, SpanStatusCode, type Tracer, trace } from "@opentelemetry/api";

const tracer: Tracer = trace.getTracer("bones-nextjs-app");

type LogLevel = "log" | "info" | "error" | "warn" | "debug";
type Metadata = Record<string, unknown>;

const createLogFunction =
	(level: LogLevel) =>
	(message: string, metadata?: Metadata, error: Error | null = null): void => {
		const span: Span = tracer.startSpan(`log.${level}`);
		span.setAttribute("log.message", message);
		span.setAttribute("log.level", level);

		if (error) {
			span.recordException(error);
			span.setStatus({ code: SpanStatusCode.ERROR });
		}

		if (metadata) {
			Object.entries(metadata).forEach(([key, value]) => {
				span.setAttribute(`log.metadata.${key}`, JSON.stringify(value));
			});
		}

		span.end();

		// Use console[level] if it exists, otherwise fall back to console.log
		const consoleMethod = (console[level] as Console[LogLevel]) ?? console.log;
		consoleMethod(message, ...(error ? [error] : []), metadata);
	};

export const otelLogger = {
	log: createLogFunction("log"),
	info: createLogFunction("info"),
	error: createLogFunction("error"),
	warn: createLogFunction("warn"),
	debug: createLogFunction("debug"),
};

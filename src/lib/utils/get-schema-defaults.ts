/*
 * @see: https://github.com/colinhacks/zod/discussions/1953#discussioncomment-5695528
 * Updated for Zod v4 compatibility (ZodEffects removed, use ZodPipe/ZodTransform)
 */
import { z } from "zod";

type ZodObjectLike = z.ZodObject<any>;

function isZodPipe(schema: z.ZodTypeAny): schema is z.ZodPipe<any, any> {
  return schema instanceof z.ZodPipe;
}

// The generic has to be bound to the argument. While it was a free
// `T extends z.ZodTypeAny`, any caller that did not pass it explicitly got
// `z.infer<ZodTypeAny>` back, which is `unknown`. Spreading that is a type
// error, so only the explicit-generic callers ever got typed defaults.
export const getSchemaDefaults = <T extends ZodObjectLike | z.ZodPipe<any, any>>(
  schema: T
): z.infer<T> => {
  // Handle ZodPipe (replaces ZodEffects in Zod v4)
  if (isZodPipe(schema)) {
    const inner = (schema as any)._def?.in ?? (schema as any).in;
    if (inner && isZodPipe(inner)) {
      return getSchemaDefaults(inner) as z.infer<T>;
    }
    if (inner instanceof z.ZodObject) {
      // The unwrapped schema is not T, so its defaults have to be re-asserted.
      return getSchemaDefaults(inner) as z.infer<T>;
    }
    return {} as z.infer<T>;
  }

  function getDefaultValue(schema: z.ZodTypeAny): unknown {
    if (schema instanceof z.ZodDefault) {
      // Zod 4 stores the default as a value. Zod 3 stored a thunk, and calling
      // it here threw "defaultValue is not a function" at runtime.
      return (schema._def as { defaultValue: unknown }).defaultValue;
    }
    if (schema instanceof z.ZodArray) {
      return [];
    }
    if (schema instanceof z.ZodString) {
      return "";
    }
    if (schema instanceof z.ZodObject) {
      return getSchemaDefaults(schema);
    }
    if (isZodPipe(schema)) {
      return getSchemaDefaults(schema as any);
    }

    if (!("innerType" in schema._def)) {
      return undefined;
    }
    return getDefaultValue((schema._def as { innerType: z.ZodTypeAny }).innerType);
  }

  return Object.fromEntries(
    Object.entries((schema as ZodObjectLike).shape as Record<string, z.ZodTypeAny>).map(
      ([key, value]) => {
        return [key, getDefaultValue(value)];
      }
    )
  ) as z.infer<T>;
};

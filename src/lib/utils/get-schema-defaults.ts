/*
 * @see: https://github.com/colinhacks/zod/discussions/1953#discussioncomment-5695528
 * Updated for Zod v4 compatibility (ZodEffects removed, use ZodPipe/ZodTransform)
 */
import { z } from "zod";

type ZodObjectLike = z.ZodObject<any>;

function isZodPipe(schema: z.ZodTypeAny): schema is z.ZodPipe<any, any> {
  return schema instanceof z.ZodPipe;
}

export const getSchemaDefaults = <T extends z.ZodTypeAny>(
  schema: ZodObjectLike | z.ZodPipe<any, any>
): z.infer<T> => {
  // Handle ZodPipe (replaces ZodEffects in Zod v4)
  if (isZodPipe(schema)) {
    const inner = (schema as any)._def?.in ?? (schema as any).in;
    if (inner && isZodPipe(inner)) {
      return getSchemaDefaults(inner);
    }
    if (inner instanceof z.ZodObject) {
      return getSchemaDefaults(inner);
    }
    return {} as z.infer<T>;
  }

  function getDefaultValue(schema: z.ZodTypeAny): unknown {
    if (schema instanceof z.ZodDefault) {
      return schema._def.defaultValue();
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
    return getDefaultValue(schema._def.innerType);
  }

  return Object.fromEntries(
    Object.entries((schema as ZodObjectLike).shape).map(([key, value]) => {
      return [key, getDefaultValue(value as z.ZodTypeAny)];
    })
  );
};

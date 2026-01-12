/*
 * @see: https://github.com/colinhacks/zod/discussions/1953#discussioncomment-5695528
 * Updated for Zod v4 compatibility - uses _zod.typeName instead of instanceof
 */
import { z } from "zod";

function getTypeName(schema: z.ZodTypeAny): string | undefined {
	return (schema as any)?._zod?.typeName;
}

export const getSchemaDefaults = <T extends z.ZodTypeAny>(
	schema: z.AnyZodObject | z.ZodEffects<any>
): z.infer<T> => {
	const typeName = getTypeName(schema as z.ZodTypeAny);

	// Check if it's a ZodEffect
	if (typeName === "ZodEffects") {
		const innerType = (schema as z.ZodEffects<any>).innerType();
		// Check if it's a recursive ZodEffect
		if (getTypeName(innerType) === "ZodEffects") {
			return getSchemaDefaults(innerType);
		}
		// return schema inner shape as a fresh zodObject
		return getSchemaDefaults(z.object(innerType.shape));
	}

	function getDefaultValue(schema: z.ZodTypeAny): unknown {
		const typeName = getTypeName(schema);

		if (typeName === "ZodDefault") {
			return (schema as any)._zod.def.defaultValue;
		}
		// return an empty array if it is
		if (typeName === "ZodArray") {
			return [];
		}
		// return an empty string if it is
		if (typeName === "ZodString") {
			return "";
		}
		// return an content of object recursively
		if (typeName === "ZodObject") {
			return getSchemaDefaults(schema as z.AnyZodObject);
		}

		const def = (schema as any)?._zod?.def;
		if (!def || !("innerType" in def)) {
			return undefined;
		}
		return getDefaultValue(def.innerType);
	}

	return Object.fromEntries(
		Object.entries((schema as z.AnyZodObject).shape).map(([key, value]) => {
			return [key, getDefaultValue(value as z.ZodTypeAny)];
		})
	);
};

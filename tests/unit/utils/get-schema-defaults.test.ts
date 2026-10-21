import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";

describe("getSchemaDefaults", () => {
  it("reads zod 4 defaults, which are values rather than thunks", () => {
    const schema = z.object({
      theme: z.string().default("system"),
      pageSize: z.number().default(25),
    });

    // Zod 3 stored _def.defaultValue as a function. Calling it under zod 4
    // throws "defaultValue is not a function" for every field with a default.
    expect(getSchemaDefaults(schema)).toEqual({ theme: "system", pageSize: 25 });
  });

  it("falls back per type when a field has no default", () => {
    const schema = z.object({
      email: z.string(),
      tags: z.array(z.string()),
      nested: z.object({ name: z.string().default("anonymous") }),
    });

    expect(getSchemaDefaults(schema)).toEqual({
      email: "",
      tags: [],
      nested: { name: "anonymous" },
    });
  });

  it("unwraps optional fields down to their inner default", () => {
    const schema = z.object({
      note: z.string().default("hello").optional(),
    });

    expect(getSchemaDefaults(schema)).toEqual({ note: "hello" });
  });

  it("returns real defaults for the live auth schemas", () => {
    const signInSchema = z.object({
      email: z.string({ error: "Email is required" }),
      password: z.string({ error: "Password is required" }),
    });

    expect(getSchemaDefaults(signInSchema)).toEqual({ email: "", password: "" });
  });
});

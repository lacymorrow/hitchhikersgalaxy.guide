/**
 * Regression tests for the zod 4 error-shape migration (LAC-5204).
 *
 * zod 4 removed `ZodError.formErrors` and `ZodError.errors`. Code that still
 * reached for them threw a TypeError at runtime instead of returning the
 * validation message it was supposed to surface. These tests pin the
 * replacements: `z.flattenError(error).fieldErrors` and `error.issues`.
 */

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/server/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "test-user", email: "test@example.com" } })),
}));

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const invalidFormData = () => {
  const formData = new FormData();
  formData.set("email", "not-an-email");
  formData.set("password", "short");
  return formData;
};

describe("zod 4 ZodError shape", () => {
  it("no longer exposes formErrors or errors", () => {
    const result = schema.safeParse({ email: "nope", password: "short" });
    expect(result.success).toBe(false);

    const error = result.error as z.ZodError;
    // The two accessors this migration had to stop using.
    expect("formErrors" in error).toBe(false);
    expect("errors" in error).toBe(false);
    // The replacements.
    expect(z.flattenError(error).fieldErrors.email?.[0]).toBeTruthy();
    expect(error.issues[0]?.message).toBeTruthy();
  });
});

// Both modules are near-identical copies of the same middleware, so each one
// gets the same coverage until one of them is retired.
for (const modulePath of ["@/lib/utils/middleware", "@/lib/utils/validated-action"] as const) {
  describe(modulePath, () => {
    it("validatedAction returns per-field messages instead of throwing", async () => {
      const { validatedAction } = await import(modulePath);
      const action = validatedAction(schema, async () => ({ success: "ran" }));

      const state = await action({}, invalidFormData());

      expect(state.error.email.message).toBeTruthy();
      expect(state.error.password.message).toBeTruthy();
    });

    it("validatedAction still runs the action on valid input", async () => {
      const { validatedAction } = await import(modulePath);
      const action = validatedAction(schema, async (data) => ({ success: data.email }));

      const formData = new FormData();
      formData.set("email", "someone@example.com");
      formData.set("password", "long-enough");

      expect(await action({}, formData)).toEqual({ success: "someone@example.com" });
    });

    it("validatedActionWithUser returns the first issue message instead of throwing", async () => {
      const { validatedActionWithUser } = await import(modulePath);
      const action = validatedActionWithUser(schema, async () => ({ success: "ran" }));

      const state = await action({}, invalidFormData());

      expect(typeof state.error).toBe("string");
      expect(state.error.length).toBeGreaterThan(0);
    });
  });
}

describe("validateProjectName", () => {
  it("returns the validation message instead of throwing", async () => {
    const { validateProjectName } = await import("@/lib/schemas/deployment");

    const result = validateProjectName("");

    expect(result.isValid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("accepts a valid project name", async () => {
    const { validateProjectName } = await import("@/lib/schemas/deployment");

    expect(validateProjectName("my-project").isValid).toBe(true);
  });
});

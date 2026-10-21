"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { signInActionSchema } from "@/lib/schemas/auth";
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";
import { getSafeNextUrl } from "@/lib/utils/safe-next-url";
import { signInWithCredentialsAction } from "@/server/actions/auth";

export const SignInForm = () => {
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get(SEARCH_PARAM_KEYS.nextUrl) ?? null;
  // Only a same-origin path is safe to hand to the action; see getSafeNextUrl.
  const safeNextUrl = getSafeNextUrl(nextUrl);
  // The action takes redirectTo and redirect, which live on signInActionSchema and
  // not on signInSchema. Typing the form with the narrower schema meant those two
  // defaults were excess properties, and `mode` was sitting inside defaultValues
  // where react-hook-form never reads it, so the form never validated on change.
  const form = useForm<z.infer<typeof signInActionSchema>>({
    resolver: zodResolver(signInActionSchema),
    defaultValues: {
      ...getSchemaDefaults(signInActionSchema),
      // Send the user back where they came from, falling back to home.
      redirectTo: safeNextUrl ?? routes.home,
      redirect: true,
    },
    mode: "onChange",
  });

  async function onSubmit(values: z.infer<typeof signInActionSchema>) {
    try {
      const result = await signInWithCredentialsAction(values);

      // A rejected sign-in resolves with { ok: false } instead of throwing, so
      // without this the form reported success on a bad password.
      if (result && !result.ok) {
        toast.error("Error", {
          description:
            "error" in result && result.error
              ? String(result.error)
              : "Invalid email or password. Please try again.",
        });
        return;
      }

      toast.success("Success", {
        description: "Signed in successfully.",
      });
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("invalid credentials") ||
          errorMessage.includes("user not found")
        ) {
          toast.error("Error", {
            description: "Invalid email or password. Please try again.",
          });
        } else {
          toast.error("Error", {
            description: error.message,
          });
        }
      } else {
        toast.error("Error", {
          description: "Something went wrong. Please try again.",
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="me@example.com" type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href={routes.auth.forgotPassword}
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting || !form.formState.isValid}
        >
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
};

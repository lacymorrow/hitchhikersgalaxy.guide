"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logger } from "@/lib/logger";
import { isFormFieldRequired } from "@/lib/utils/is-form-field-required";
import { isSpamAction } from "@/server/services/is-spam/is-spam";
import { isSpamSchema } from "@/server/services/is-spam/is-spam-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type z } from "zod";
import { useServerAction } from "zsa-react";

const isFieldRequired = (fieldName: keyof typeof isSpamSchema.shape) =>
  isFormFieldRequired(isSpamSchema, fieldName);

export function SpamDemo() {
  const { isPending, execute, data } = useServerAction(isSpamAction);

  const form = useForm<z.infer<typeof isSpamSchema>>({
    resolver: zodResolver(isSpamSchema),
  });

  async function onSubmit(data: z.infer<typeof isSpamSchema>) {
    const [result, error] = await execute(data);

    if (error) {
      logger.error(error);
      if (error.code === "NOT_AUTHORIZED") {
        toast.error("You are not authorized to perform this action.");
      } else if (error.code === "INPUT_PARSE_ERROR") {
        // Handle input validation errors
        if (error.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, messages]) => {
            form.setError(field as keyof typeof data, {
              type: "manual",
              message: Array.isArray(messages) ? messages[0] : messages,
            });
          });
        }
      } else {
        toast.error("An unexpected error occurred.");
      }
      logger.error(error);
      return;
    }

    toast.success(`Message classified as ${result > 0 ? "spam" : "not spam"}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6"
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your message here"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the message content to check for spam.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Sender{" "}
                {!isFieldRequired("sender") && (
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter sender's name or email" {...field} />
              </FormControl>
              <FormDescription>
                Optionally provide the sender&apos;s information.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Checking..." : "Check for Spam"}
        </Button>
        <div>{isPending ? "saving..." : data}</div>
      </form>
    </Form>
  );
}

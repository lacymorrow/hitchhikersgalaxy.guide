"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  question: z.string().min(1, "Please enter a question"),
});

export function WWJHDDemo() {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/wwjhd/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to fetch response");

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error("Error:", error);
      setResponse("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
      <h1 className="mb-6 text-center text-3xl font-bold text-sky-700">
        What Would Jesus Have Done?
      </h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Enter your question here..."
                    className="min-h-[100px] resize-none rounded-lg border-2 border-sky-200 p-4 text-lg focus:border-sky-500 text-black"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full rounded-lg bg-sky-600 py-3 font-bold text-white transition-colors hover:bg-sky-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asking Jesus...
              </>
            ) : (
              "What Would Jesus Do?"
            )}
          </Button>
        </form>
      </Form>
      {isLoading && (
        <div className="mt-6 text-center">
          <p className="animate-pulse text-lg font-semibold text-sky-600">
            "{form.getValues().question}"
          </p>
        </div>
      )}
      {response && (
        <div className="mt-6 rounded-lg bg-sky-50 p-4">
          <h2 className="mb-2 text-xl font-semibold text-sky-800">Response:</h2>
          <p className="whitespace-pre-wrap text-gray-700">{response}</p>
        </div>
      )}
    </div>
  );
}

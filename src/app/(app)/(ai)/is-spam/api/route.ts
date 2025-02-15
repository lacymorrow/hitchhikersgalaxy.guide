/**
 * API Endpoint: /api/ai/is-spam
 * Description:
 * This endpoint receives an email content and an optional sender,
 * then determines if the email is spam or a phishing attempt.
 * It returns an object with:
 * - `isSpam`: A boolean indicating spam status.
 * - `threshold`: A number between 0 and 1 indicating confidence level.
 * Utilizes OpenAI GPT-3.5 Turbo model for analysis.
 */

import { isSpam } from "@/server/services/is-spam/is-spam";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  content: z.string(),
  sender: z.string().optional(),
});

/**
 * Handles both GET and POST requests to determine if an email is spam or a phishing attempt.
 * Accepts content either in the request body or search params.
 */
async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const method = req.method;

    let data: z.infer<typeof schema>;

    if (method === "GET") {
      data = schema.parse({
        content: searchParams.get("content"),
        sender: searchParams.get("sender"),
      });
    } else if (method === "POST") {
      const body = await req.json();
      data = schema.parse(body);
    } else {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    const result = await isSpam(data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = handler;
export const POST = handler;

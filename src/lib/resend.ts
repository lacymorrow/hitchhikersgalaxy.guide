import { env } from "@/env";
import { Resend } from "resend";

/**
 * Initialize Resend with API key if available, otherwise return null
 * This allows the application to build even if AUTH_RESEND_KEY is not set
 */
export const resend = env.AUTH_RESEND_KEY
	? new Resend(env.AUTH_RESEND_KEY)
	: null;

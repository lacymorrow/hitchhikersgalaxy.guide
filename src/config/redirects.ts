import { createRedirects, type Redirect } from "@/lib/utils/redirect";
import { routes } from "./routes";

/**
 * Next.js redirect configuration.
 * Imported by next.config.ts — keep route aliases centralized here.
 */
/* eslint-disable-next-line @typescript-eslint/require-await */
export const redirects = async (): Promise<Redirect[]> => {
	return [
		...createRedirects(["/doc", "/docs", "/documentation"], routes.docs, true),
		...createRedirects(
			["/account", "/accounts", "/settings/accounts"],
			routes.settings.account,
			true,
		),
		...createRedirects(
			["/join", "/signup", "/sign-up"],
			routes.auth.signUp,
			true,
		),
		...createRedirects(
			["/login", "/log-in", "/signin", "/sign-in"],
			routes.auth.signIn,
		),
		...createRedirects(
			["/logout", "/log-out", "/signout", "/sign-out"],
			routes.auth.signOut,
		),
	];
};

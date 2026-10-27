/**
 * The result of a guide read that is allowed to fail without throwing.
 *
 * `unavailable` means the query itself did not come back -- the database is
 * unreachable, or there is none configured. It is not the same as a table with
 * no rows, and flattening the two into `[]` is what showed visitors "No
 * entries yet. Start exploring to create some!" while thousands of entries sat
 * behind an exhausted Neon compute quota (LAC-5520). Reads must still resolve
 * rather than reject, or `next build` dies prerendering `/popular` (LAC-5405).
 *
 * Keep this a discriminated union rather than a nullable list: a sentinel gets
 * swallowed by the next `?? []` somebody writes, while this makes the compiler
 * ask which of the two states the caller is rendering.
 */
export type GuideRead<T> =
  { readonly status: "ok"; readonly data: T } | { readonly status: "unavailable" };

/** Narrow a read to its rows, treating an outage as no rows. For callers that
 *  only decorate a page with entries and have no state of their own to show. */
export const guideReadOr = <T>(result: GuideRead<T>, fallback: T): T =>
  result.status === "ok" ? result.data : fallback;

/**
 * Why a find-or-generate search came back without an entry.
 *
 * The same distinction as `GuideRead`, one layer up: `not_found` means the
 * term was refused or is empty, and `unavailable` means the Guide could not
 * answer. The second must not reach a visitor or a crawler as a 404 -- see
 * the status table in `src/server/actions/guide-search.ts`.
 */
export type GuideSearchFailure = "not_found" | "unavailable";

/**
 * Thrown by a route that cannot answer because the Guide is unreachable.
 *
 * It exists to be uncaught. Next.js settles the document status from whether
 * the server render threw, so throwing before the first byte is the only way a
 * page can answer with a retryable 5xx instead of 200 or 404. Catch it and you
 * are back to the soft 404 this replaced (LAC-5888).
 */
export class GuideUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuideUnavailableError";
  }
}

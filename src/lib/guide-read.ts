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

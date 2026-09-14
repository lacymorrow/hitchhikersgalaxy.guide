import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getDocFromParams } from "@/lib/docs";

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string[] }>;
}

/**
 * Existence check for /docs/[[...slug]].
 *
 * The docs skeleton (loading.tsx) used to live one level up, where it also
 * wrapped this segment and let an unknown doc stream as HTTP 200. It now sits
 * beside this layout, which settles the status first.
 */
export default async function DocsPageLayout({ children, params }: Props) {
  const page = await getDocFromParams(params);
  if (!page) notFound();
  return children;
}

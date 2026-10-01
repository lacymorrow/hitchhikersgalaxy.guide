/**
 * GENERATED FILE. Do not edit by hand.
 *
 * Built by scripts/generate-providers.ts from every `*.provider.tsx` file in
 * this directory (`predev` and `prebuild` run it). Add a provider by adding a
 * file; never edit this index. Mounted once in
 * src/components/layouts/root-layout.tsx.
 */

import type { ReactNode } from "react";
import ClerkProvider from "./clerk.provider";

export const Providers = ({ children }: { children: ReactNode }) => (
  <ClerkProvider>{children}</ClerkProvider>
);

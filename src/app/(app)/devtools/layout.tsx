// Prevent access to the dev pages in production

import { notFound } from "next/navigation";
import { env } from "@/env";
export default function DevLayout({ children }: { children: React.ReactNode }) {
	if (env.NODE_ENV !== "development") {
		notFound();
	}

	return <>{children}</>;
}

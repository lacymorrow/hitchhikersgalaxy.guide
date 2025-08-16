"use client";

import { useSearchParams } from "next/navigation";
import { Boundary } from "@/components/primitives/boundary";
import { routes } from "@/config/routes";

enum Error {
	Configuration = "Configuration",
}

const errorMessageMap: Record<Error, string> = {
	[Error.Configuration]:
		"There was a problem when trying to authenticate. Please contact us if this error persists.",
};

export default function AuthErrorPage() {
	const searchParams = useSearchParams();
	const error = searchParams?.get("error") as Error;
	const message = (error && errorMessageMap[error]) || "Please contact us if this error persists.";

	return (
		<Boundary
			title="Something went wrong."
			description={message}
			href={routes.home}
			actionText="Take me home"
			className="max-w-xl mx-auto"
		>
			{error && (
				<div className="text-xs text-muted-foreground">
					Unique error code: <code className="rounded-sm bg-slate-100 p-1 text-xs">{error}</code>
				</div>
			)}
		</Boundary>
	);
}

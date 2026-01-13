import type { Metadata } from "next";
import { ResetPasswordForm } from "@/app/(app)/(authentication)/reset-password/_components/reset-password-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { AuthenticationCard } from "../_components/authentication-card";

export const metadata: Metadata = constructMetadata({
	title: "Reset Password",
	description: `Create a new password for your ${siteConfig.name} account.`,
});

export default async function ResetPasswordPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	return (
		<AuthenticationCard>
			<CardHeader>
				<CardTitle className="text-2xl">Reset Password</CardTitle>
				<CardDescription>Create a new password for your account</CardDescription>
			</CardHeader>
			<CardContent>
				<ResetPasswordForm token={resolvedSearchParams?.token} />
			</CardContent>
		</AuthenticationCard>
	);
}

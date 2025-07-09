import { ResetPasswordForm } from "@/app/(app)/(authentication)/reset-password/_components/reset-password-form";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthenticationCard } from "../_components/authentication-card";

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

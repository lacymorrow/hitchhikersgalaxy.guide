import { AuthForm } from "@/app/(app)/(authentication)/_components/auth-form";
import { CredentialsForm } from "@/app/(app)/(authentication)/_components/credentials-form";
import { GuestForm } from "@/app/(app)/(authentication)/_components/guest-form";
import { Divider } from "@/components/primitives/divider";
import { env } from "@/env";
import { isGuestOnlyMode } from "@/server/auth-providers-utils";

export const SignIn = async () => {
	// Special handling for guest-only mode
	if (isGuestOnlyMode) {
		return (
			<AuthForm
				mode="sign-in"
				withFooter={false}
				title="Welcome"
				description="Enter your name to get started"
			>
				<GuestForm />
			</AuthForm>
		);
	}

	return (
		<AuthForm mode="sign-in" withFooter={false}>
			{env.NEXT_PUBLIC_FEATURE_AUTH_CREDENTIALS_ENABLED && (
				<>
					<Divider text="Or continue with email" />
					<CredentialsForm />
				</>
			)}
		</AuthForm>
	);
};

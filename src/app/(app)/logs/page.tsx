import { auth } from "@/server/auth";
import { LandingPageComponent } from "./_components/landing-page";

const LandingPage = async () => {
	const session = await auth();
	const user = session?.user;
	return (
		<>
			<LandingPageComponent user={user} />
		</>
	);
};

export default LandingPage;

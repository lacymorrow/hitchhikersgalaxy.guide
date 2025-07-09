import { SignIn } from "@/app/(app)/(authentication)/sign-in/_components/sign-in";
import { Modal } from "@/components/primitives/modal";

export default async function Page() {
	return (
		<Modal routeBack={true}>
			<SignIn />
		</Modal>
	);
}

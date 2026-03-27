import { ShipkitIoView } from "@/app/(app)/(kit)/_shipkit-io-components/shipkit-io-view";
import { OnboardingView } from "@/app/(app)/(kit)/_components/onboarding-view";
import { isShipkitIo } from "@/lib/utils/url-utils";

export default function ShipkitHomePage() {
  if (isShipkitIo) {
    return <ShipkitIoView />;
  }
  return <OnboardingView />;
}

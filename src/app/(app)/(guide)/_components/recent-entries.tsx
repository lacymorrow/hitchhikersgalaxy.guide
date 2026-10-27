import Marquee from "@/components/ui/marquee";
import { guideService } from "@/server/services/guide-service";
import { EntryCard } from "./entry-card";
import { GuideEmpty, GuideUnavailable } from "./guide-states";

// The band is a fixed 200px whichever state it renders, so the home page below
// it does not jump when the database comes back.
const BAND = "flex items-center justify-center h-[200px] text-[#70c8cd]";

export async function RecentEntries() {
	// This used to be a try/catch around the read, which stopped catching
	// anything once the service started resolving instead of rejecting, so an
	// outage fell through to the empty state and told visitors the guide was
	// empty (LAC-5520). The service now reports the two apart.
	const recent = await guideService.getRecentEntries(20);

	if (recent.status === "unavailable") {
		return (
			<div className={BAND}>
				<GuideUnavailable compact />
			</div>
		);
	}

	if (recent.data.length === 0) {
		return (
			<div className={BAND}>
				<GuideEmpty />
			</div>
		);
	}

	return (
		<div className="[mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent_100%)]">
			<Marquee className="py-4 h-[200px]" pauseOnHover>
				{recent.data.map((entry, index) => (
					<EntryCard key={entry.id} entry={entry} index={index} />
				))}
			</Marquee>
		</div>
	);
}

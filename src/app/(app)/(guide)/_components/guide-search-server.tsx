import { guideService } from "@/server/services/guide-service";
import { GuideSearch } from "./guide-search";

interface GuideSearchServerProps {
	searchTerm: string;
}

export async function GuideSearchServer({ searchTerm }: GuideSearchServerProps) {
	const results = await guideService?.getSimilarSearches(searchTerm);
	return <GuideSearch results={results} />;
}

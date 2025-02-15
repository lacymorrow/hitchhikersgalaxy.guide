import { getSimilarSearches } from "@/server/actions/guide-search";
import { GuideSearch } from "./guide-search"; // Import the client component

interface GuideSearchServerProps {
	searchTerm: string;
}

export const GuideSearchServer = async ({ searchTerm }: GuideSearchServerProps) => {
	const results = await getSimilarSearches(searchTerm);

	return <GuideSearch results={results} />;
};

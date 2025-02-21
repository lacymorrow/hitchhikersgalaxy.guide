import { getSimilarSearches } from "@/server/services/guide-search";
import { GuideSearchInline } from "./guide-search-inline";

interface GuideSearchInlineServerProps {
    searchTerm?: string;
}

export async function GuideSearchInlineServer({
    searchTerm = "",
}: GuideSearchInlineServerProps) {
    const results = searchTerm ? await getSimilarSearches(searchTerm) : [];

    return <GuideSearchInline results={results} />;
}

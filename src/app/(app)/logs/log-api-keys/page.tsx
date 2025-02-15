import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createTestApiKey } from "@/server/actions/api-key-actions";
import { auth } from "@/server/auth";
import { apiKeyService } from "@/server/services/api-key-service";
import { redirect } from "next/navigation";
import { ApiKeysTable } from "./_components/api-keys-table";

const handleCreateKey = async () => {
	await createTestApiKey();
};

const ApiKeysPage = async () => {
	const session = await auth();
	if (!session) {
		return redirect(routes.home);
	}

	const apiKeysData = await apiKeyService.getUserApiKeys(session.user.id);
	const apiKeys = apiKeysData.map((data) => data.apiKey);

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-4 text-2xl font-bold">API Keys</h1>
			<form action={handleCreateKey}>
				<Button type="submit" className="mb-4">
					Generate New API Key
				</Button>
			</form>
			<ApiKeysTable data={apiKeys} />
		</div>
	);
};

export default ApiKeysPage;

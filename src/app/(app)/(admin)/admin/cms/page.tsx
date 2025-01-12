"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { seedCMSAction } from "./actions";

export default function CMSPage() {
	const [adminSecret, setAdminSecret] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const handleSeed = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setLoading(true);
			setMessage(null);

			const result = await seedCMSAction(adminSecret);

			setMessage({
				type: result.success ? "success" : "error",
				text: result.message,
			});
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "An error occurred",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto py-10">
			<h1 className="mb-8 text-3xl font-bold">CMS Management</h1>

			<Card className="max-w-md">
				<CardHeader>
					<CardTitle>Seed CMS Data</CardTitle>
					<CardDescription>
						Seed the CMS with initial data. This will clear existing data first.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form onSubmit={handleSeed} className="space-y-4">
						<div className="space-y-2">
							<Input
								type="password"
								placeholder="Admin Secret"
								value={adminSecret}
								onChange={(e) => setAdminSecret(e.target.value)}
							/>
						</div>

						<Button
							type="submit"
							disabled={loading || !adminSecret}
							className="w-full"
						>
							{loading ? "Seeding..." : "Seed CMS"}
						</Button>

						{message && (
							<p
								className={`mt-2 text-sm ${
									message.type === "success" ? "text-green-600" : "text-red-600"
								}`}
							>
								{message.text}
							</p>
						)}
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { routes } from "@/config/routes";
import { logger } from "@/lib/logger";
import type { LogData } from "@/types/logger";
import { useEffect, useState } from "react";
import type { ApiKey } from "../log-api-keys/_components/api-keys-table";
import { logColumns } from "./columns";

interface LiveLogsProps {
	apiKeys?: ApiKey[];
}

export const LiveLogs = ({ apiKeys = [] }: LiveLogsProps) => {
	const [logs, setLogs] = useState<LogData[]>([]);
	const [selectedApiKey, setSelectedApiKey] = useState<string>("");
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isSendingTestLog, setIsSendingTestLog] = useState<boolean>(false);

	useEffect(() => {
		if (!selectedApiKey || !isConnected) return;

		logger.info("Connecting to SSE for live logs");
		const eventSource = new EventSource(`${routes.api.sse}?key=${selectedApiKey}`);

		eventSource.onmessage = (event) => {
			const newLog = JSON.parse(event.data);
			setLogs((prevLogs) => [...prevLogs, newLog]);
		};

		eventSource.onerror = (error) => {
			logger.error("SSE error:", error);
			setIsConnected(false);
			eventSource.close();
		};

		return () => {
			logger.info("Closing SSE connection");
			setIsConnected(false);
			eventSource.close();
		};
	}, [selectedApiKey, isConnected]);

	const handleConnect = () => {
		if (!selectedApiKey) return;
		setLogs([]); // Clear previous logs when changing API key
		setIsConnected(true);
	};

	const handleDisconnect = () => {
		setIsConnected(false);
		setLogs([]);
	};

	const handleSendTestLog = async () => {
		if (!selectedApiKey) return;

		setIsSendingTestLog(true);
		try {
			const response = await fetch(routes.api.sendTestLog, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ apiKey: selectedApiKey }),
			});

			if (!response.ok) {
				throw new Error("Failed to send test log");
			}

			logger.info("Test log sent successfully");
		} catch (error) {
			logger.error("Error sending test log:", error);
		} finally {
			setIsSendingTestLog(false);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-4 text-2xl font-bold">Live Application Logs</h1>

			<div className="mb-4 flex items-center gap-2">
				<Select
					value={selectedApiKey}
					onValueChange={setSelectedApiKey}
					disabled={isConnected}
				>
					<SelectTrigger className="w-[300px]">
						<SelectValue placeholder="Select an API key" />
					</SelectTrigger>
					<SelectContent>
						{apiKeys.map((apiKey) => (
							<SelectItem key={apiKey.id} value={apiKey.key}>
								{apiKey.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{!isConnected ? (
					<Button onClick={handleConnect} disabled={!selectedApiKey}>
						Connect
					</Button>
				) : (
					<Button onClick={handleDisconnect} variant="destructive">
						Disconnect
					</Button>
				)}
			</div>

			{isConnected && (
				<Button
					onClick={() => void handleSendTestLog()}
					disabled={isSendingTestLog}
					className="mb-4"
				>
					{isSendingTestLog ? "Sending..." : "Send Test Log"}
				</Button>
			)}

			<DataTable
				columns={logColumns}
				data={logs}
				className="min-h-[400px]"
			/>
		</div>
	);
};

import { FormMonitorDashboard } from "@/components/form-monitor";

export const metadata = {
	title: "Form Monitor | Shipkit",
	description: "Monitor your forms like an uptime service",
};

export default function FormMonitorPage() {
	return (
		<div className="container mx-auto py-8 px-4">
			<FormMonitorDashboard />
		</div>
	);
}

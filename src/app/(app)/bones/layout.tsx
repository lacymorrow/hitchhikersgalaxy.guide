import { VercelNavigation } from "@/components/ui/vercel-navigation";
import { routes } from "@/config/routes";
import { BoneIcon } from "lucide-react";
import type React from "react";
const navLinks = [
	{
		label: <><BoneIcon className="ml-8 mr-4 w-4 h-4" /></>,
		href: routes.home,
	},
	{
		label: "CLI",
		href: "/cli",
	},
	{
		label: "Log",
		href: "https://log.bones.sh",
	},
	{
		label: "Shipkit",
		href: "https://shipkit.io",
	}
];

export default function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<div className="mx-auto p-8 grid place-items-center">
				<VercelNavigation navLinks={navLinks} />
			</div>
			{children}
		</>
	);
}

import { routes } from "@/config/routes";
import { redirect } from "next/navigation";

/**
 * Admin page component that displays a data table of users and their payment status
 */
export default async function AdminPage() {
	redirect(routes.admin.users);
}

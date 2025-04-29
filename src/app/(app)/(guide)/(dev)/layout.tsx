import { notFound } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
	if (process.env.NODE_ENV === "development") {
		return children;
	}

	return notFound();
}

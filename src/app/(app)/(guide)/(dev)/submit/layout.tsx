import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
	title: "Submit an Entry",
	description: "Contribute to the Hitchhiker's Guide to the Galaxy. Submit your knowledge about anything in the universe — from local customs to galactic phenomena.",
};

export default function SubmitLayout({ children }: { children: ReactNode }) {
	return children;
}

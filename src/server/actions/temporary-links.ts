"use server";

import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";
import { createTemporaryLink, getTemporaryLinkData } from "@/server/services/temporary-links";

export const generateTemporaryLink = async ({
	data = "hello",
	userId,
}: {
	data?: string;
	userId: string;
}) => {
	const link = await createTemporaryLink({ data, userId, type: "download" });
	if (!link || link.length === 0) {
		throw new Error("Failed to create temporary link");
	}
	return link[0].id;
};

export const getTemporaryLink = async (linkId: string) => {
	const session = await auth();
	if (!session?.user?.id) {
		redirect(routes.auth.signIn);
	}

	return await getTemporaryLinkData(linkId, session.user.id);
};

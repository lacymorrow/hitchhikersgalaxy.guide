/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

import config from "@payload-config";
import { env } from "@/env";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import type React from "react";
import { importMap } from "./cms/importMap.js";

interface Args {
	children: React.ReactNode;
}

const serverFunction: ServerFunctionClient = async (args) => {
	"use server";
	return handleServerFunctions({
		...args,
		config,
		importMap,
	});
};

const Layout = ({ children }: Args) => {
	if (env.NEXT_PUBLIC_FEATURE_PAYLOAD_ENABLED) {
		return (
			<RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
				{children}
			</RootLayout>
		);
	}

	return <>{children}</>;
};

export default Layout;

/*
 * Next.js Config Tests
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js#unit-testing-experimental
 * ! This is experimental and may not work in all cases
 */

import { describe, expect, test } from "vitest";

import nextConfig from "next.config";
import {
	getRedirectUrl,
	unstable_getResponseFromNextConfig,
} from 'next/experimental/testing/server';

// Skip experimental Next.js config tests for now
describe.skip("Next.js Config", () => {
	describe("next.config.ts", () => {
		test("should return 307 status code and redirect to /sign-in", async () => {
			const response = await unstable_getResponseFromNextConfig({
				url: 'https://bones.sh/login',
				nextConfig: nextConfig,
			})
			expect(response.status).toEqual(307)
			expect(getRedirectUrl(response)).toEqual('https://bones.sh/sign-in')
		});
	});
});

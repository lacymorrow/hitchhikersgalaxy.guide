'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import PostHogPageView from './posthog-page-view'
import { env } from '@/env'
export function PostHogProvider({ children }: { children: React.ReactNode }) {
	const posthogKey = env?.NEXT_PUBLIC_POSTHOG_KEY
	const posthogHost = env?.NEXT_PUBLIC_POSTHOG_HOST

	if (!posthogKey || !posthogHost) {
		return children
	}

	useEffect(() => {
		posthog.init(posthogKey, {
			api_host: posthogHost,
			person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
		})
	}, [])

	return (
		<PHProvider client={posthog}>
			<PostHogPageView />
			{children}
		</PHProvider>
	)
}

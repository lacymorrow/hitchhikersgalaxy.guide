'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { analyzeSpamAction } from './actions'
import type { SpamPrediction } from './spam-service'
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SpamDetectionPage() {
	const [isPending, startTransition] = React.useTransition()
	const [result, setResult] = React.useState<SpamPrediction | null>(null)
	const [error, setError] = React.useState<string | null>(null)

	async function onSubmit(formData: FormData) {
		setError(null)
		setResult(null)

		try {
			const response = await analyzeSpamAction(formData)
			if (!response.success) {
				setError(response.error ?? 'An error occurred')
				return
			}
			setResult(response.data ?? null)
		} catch (err) {
			setError('An unexpected error occurred')
		}
	}

	function getResultIcon() {
		if (!result) return null
		if (result.score > 0.85) {
			return result.label === 'Spam' ? (
				<XCircle className="h-6 w-6 text-destructive" />
			) : (
				<CheckCircle className="h-6 w-6 text-green-500" />
			)
		}
		return <AlertTriangle className="h-6 w-6 text-yellow-500" />
	}

	function getResultClass() {
		if (!result) return ''
		if (result.score > 0.85) {
			return result.label === 'Spam'
				? 'bg-destructive/10'
				: 'bg-green-500/10'
		}
		return 'bg-yellow-500/10'
	}

	return (
		<div className="container max-w-2xl py-8">
			<h1 className="mb-8 text-3xl font-bold">Spam Detection</h1>

			<Card className="p-6">
				<form action={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="text" className="text-sm font-medium">
							Enter text to analyze
						</label>
						<Textarea
							id="text"
							name="text"
							placeholder="Enter your text here..."
							className="min-h-[150px]"
							required
						/>
					</div>

					<Button type="submit" disabled={isPending} className="w-full">
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Analyzing...
							</>
						) : (
							'Analyze Text'
						)}
					</Button>
				</form>

				{error && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{result && (
					<div className="mt-6 space-y-4">
						<h2 className="text-xl font-semibold">Results</h2>
						<div
							className={cn(
								'rounded-lg p-4 transition-colors',
								getResultClass()
							)}
						>
							<div className="mb-4 flex items-center gap-2">
								{getResultIcon()}
								<span className="font-medium">
									{result.label}
								</span>
								<span className="ml-2 text-sm text-muted-foreground">
									(
									{(result.score * 100).toFixed(2)}
									% confidence)
								</span>
							</div>
							<p className="text-sm text-muted-foreground">
								{result.explanation}
							</p>
						</div>
					</div>
				)}
			</Card>
		</div>
	)
}

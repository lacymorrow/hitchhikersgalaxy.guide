'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Loader2 } from 'lucide-react'
import { generateReportAction } from './actions'
import type { Report } from './report-service'

export default function ReportGeneratorPage() {
	const [isPending, startTransition] = React.useTransition()
	const [result, setResult] = React.useState<Report | null>(null)
	const [error, setError] = React.useState<string | null>(null)

	async function onSubmit(formData: FormData) {
		setError(null)
		setResult(null)

		startTransition(async () => {
			try {
				const response = await generateReportAction(formData)
				if (!response.success) {
					setError(response.error ?? 'An error occurred')
					return
				}
				setResult(response.data ?? null)
			} catch (err) {
				setError('An unexpected error occurred')
			}
		})
	}

	const handleDownloadPDF = async () => {
		if (!result) return

		try {
			const response = await fetch('./api/download', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(result),
			})

			if (!response.ok) throw new Error('Failed to generate PDF')

			const blob = await response.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'report.pdf'
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
			document.body.removeChild(a)
		} catch (err) {
			setError('Failed to download PDF')
		}
	}

	return (
		<div className="container max-w-4xl py-8">
			<h1 className="mb-8 text-3xl font-bold">Report Generator</h1>

			<Card className="p-6">
				<form action={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="topic" className="text-sm font-medium">
							What would you like a report about?
						</label>
						<Textarea
							id="topic"
							name="topic"
							placeholder="Enter any topic for a comprehensive report (e.g., 'The impact of artificial intelligence on healthcare')"
							className="min-h-[100px]"
							required
						/>
					</div>

					<Button type="submit" disabled={isPending} className="w-full">
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Generating Report...
							</>
						) : (
							'Generate Report'
						)}
					</Button>
				</form>

				{error && (
					<Alert variant="destructive" className="mt-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{result && (
					<div className="mt-6 space-y-6">
						<div className="rounded-lg bg-card p-6">
							<div className="mb-4 flex items-center justify-between">
								<h2 className="text-2xl font-bold">{result.title}</h2>
								<Button
									onClick={handleDownloadPDF}
									variant="outline"
									size="sm"
								>
									<Download className="mr-2 h-4 w-4" />
									Download PDF
								</Button>
							</div>

							<div className="space-y-6">
								<div>
									<h3 className="mb-2 text-lg font-semibold">
										Executive Summary
									</h3>
									<p className="text-sm text-muted-foreground">
										{result.summary}
									</p>
								</div>

								{result.sections.map((section, i) => (
									<div key={`section-${i}`}>
										<h3 className="mb-2 text-lg font-semibold">
											{section.title}
										</h3>
										<p className="text-sm text-muted-foreground">
											{section.content}
										</p>
									</div>
								))}

								{result.recommendations.length > 0 && (
									<div>
										<h3 className="mb-2 text-lg font-semibold">
											Recommendations
										</h3>
										<ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
											{result.recommendations.map((rec, i) => (
												<li key={`rec-${i}`}>{rec}</li>
											))}
										</ul>
									</div>
								)}

								{result.sources.length > 0 && (
									<div>
										<h3 className="mb-2 text-lg font-semibold">
											Sources
										</h3>
										<ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
											{result.sources.map((source, i) => (
												<li key={`source-${i}`}>{source}</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</Card>
		</div>
	)
}

"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitGuideEntry } from "@/server/actions/guide-submit";
import { withFormPersistence } from "@/components/hoc/with-form-persistence";

const formSchema = z.object({
	searchTerm: z
		.string()
		.min(2, "Search term must be at least 2 characters")
		.max(100, "Search term must be less than 100 characters"),
	content: z
		.string()
		.min(5, "Content must be at least 5 characters")
		.max(2000, "Content must be less than 2000 characters"),
	travelAdvice: z
		.string()
		.min(5, "Travel advice must be at least 5 characters")
		.max(500, "Travel advice must be less than 500 characters"),
	whereToFind: z
		.string()
		.min(5, "Location must be at least 5 characters")
		.max(500, "Location must be less than 500 characters"),
	whatToAvoid: z
		.string()
		.min(5, "Warnings must be at least 5 characters")
		.max(500, "Warnings must be less than 500 characters"),
	funFact: z
		.string()
		.min(5, "Fun fact must be at least 5 characters")
		.max(500, "Fun fact must be less than 500 characters"),
	advertisement: z
		.string()
		.max(500, "Advertisement must be less than 500 characters")
		.optional()
		.transform((val) => val || ""),
});

interface SubmitEntryFormProps {
	form: ReturnType<typeof useForm<z.infer<typeof formSchema>>>;
}

function SubmitEntryForm({ form }: SubmitEntryFormProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setIsSubmitting(true);
			const result = await submitGuideEntry(values);

			if (!result.success || !result.data) {
				throw new Error(result.error || "Failed to submit entry");
			}

			toast({
				title: "Entry Submitted!",
				description:
					"Your contribution to the Guide has been recorded. Don't forget your towel!",
				className: "bg-green-500/10 text-green-500 border-green-500/20",
			});
			router.push(`/${encodeURIComponent(result.data.searchTerm)}`);
		} catch (error) {
			toast({
				title: "Error",
				description:
					"The Babel fish seems to be having trouble. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="container relative min-h-screen max-w-4xl py-6 lg:py-10">
			{/* Electronic book frame */}
			<div className="relative rounded-lg border-4 border-green-500 bg-black p-6 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
				{/* Screen interface */}
				<div className="flex flex-col space-y-8">
					{/* Header */}
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex items-center space-x-2">
							<BookOpen className="h-8 w-8 text-green-500" />
							<h1 className="font-mono text-4xl font-bold text-green-500">
								Submit Entry
							</h1>
						</div>
						<p className="max-w-[42rem] font-mono leading-normal text-green-400/80 sm:text-xl sm:leading-8">
							Share your knowledge with fellow hitchhikers across the galaxy.
						</p>
						<p className="max-w-[42rem] text-xs opacity-70">
							Remember: all entries are automatically rated for reliability and
							danger level by our sophisticated algorithms.
						</p>
					</div>

					{/* Form */}
					<Card className="border-green-500/20 bg-black">
						<CardHeader>
							<CardTitle className="text-green-500">New Guide Entry</CardTitle>
							<CardDescription className="text-green-400/60">
								Fill out this form to contribute your knowledge to the Guide.
								Your progress will be saved automatically.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-6"
								>
									<FormField
										control={form.control}
										name="searchTerm"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-green-500">
													Search Term
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														className="border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
														placeholder="e.g., Babel Fish, Pan Galactic Gargle Blaster"
													/>
												</FormControl>
												<FormDescription className="text-green-400/60">
													The term that users will search for to find this
													entry.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="content"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-green-500">
													Main Content
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														className="min-h-[100px] border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
														placeholder="Describe the subject in detail..."
													/>
												</FormControl>
												<FormDescription className="text-green-400/60">
													The main description of the subject. Be informative
													but concise.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="travelAdvice"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-green-500">
													Travel Advice
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														className="min-h-[80px] border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
														placeholder="Provide travel tips and advice..."
													/>
												</FormControl>
												<FormDescription className="text-green-400/60">
													Tips for travelers encountering this subject.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="whereToFind"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-green-500">
													Where to Find
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														className="min-h-[80px] border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
														placeholder="Describe where to find this..."
													/>
												</FormControl>
												<FormDescription className="text-green-400/60">
													Location information and how to get there.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="whatToAvoid"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-green-500">
													What to Avoid
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														className="min-h-[80px] border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
														placeholder="List any warnings or things to avoid..."
													/>
												</FormControl>
												<FormDescription className="text-green-400/60">
													Important warnings and things to avoid.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="funFact"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-green-500">
													Fun Fact
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														className="min-h-[80px] border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
														placeholder="Share an interesting fact..."
													/>
												</FormControl>
												<FormDescription className="text-green-400/60">
													An interesting or amusing fact about the subject.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="advertisement"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-green-500">
													Advertisement (Optional)
												</FormLabel>
												<FormControl>
													<Textarea
														{...field}
														className="min-h-[80px] border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
														placeholder="Add a sponsored message..."
													/>
												</FormControl>
												<FormDescription className="text-green-400/60">
													A message from our sponsors (optional).
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Button
										type="submit"
										disabled={isSubmitting}
										className="w-full border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20"
									>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Submitting to the Guide...
											</>
										) : (
											"Submit Entry"
										)}
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

// Wrap the form component with persistence
const PersistentSubmitEntryForm = withFormPersistence(
	SubmitEntryForm,
	{
		clearOnSubmit: true,
		debounceMs: 300, // Faster debounce for better responsiveness
	}
);

// Export the page component that creates the form and passes it to the wrapped component
export default function SubmitEntryPage() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			searchTerm: "",
			content: "",
			travelAdvice: "",
			whereToFind: "",
			whatToAvoid: "",
			funFact: "",
			advertisement: "",
		},
		mode: "onChange", // Enable validation on change
	});

	return (
		<PersistentSubmitEntryForm
			form={form}
			formKey="guide-entry"
			zodSchema={formSchema}
		/>
	);
}

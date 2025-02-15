"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm } from "@/server/actions/contact";
import { type ContactFormData, contactFormSchema, contactReasonOptions } from "@/types/contact";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface ContactFormProps {
	/** Optional default values for the form */
	defaultValues?: Partial<ContactFormData>;
	/** Optional callback when form is submitted successfully */
	onSuccess?: (data: ContactFormData) => void;
	/** Show/hide optional fields */
	showOptionalFields?: boolean;
	/** Custom class name for the form container */
	className?: string;
}

export function ContactForm({
	defaultValues,
	onSuccess,
	showOptionalFields = false,
	className,
}: ContactFormProps) {
	const { toast } = useToast();

	const form = useForm<ContactFormData>({
		resolver: zodResolver(contactFormSchema),
		defaultValues: {
			name: "",
			email: "",
			reason: "general",
			subject: "",
			message: "",
			company: "",
			phone: "",
			newsletter: false,
			...defaultValues,
		},
	});

	async function onSubmit(data: ContactFormData) {
		try {
			const formData = new FormData();
			Object.entries(data).forEach(([key, value]) => {
				formData.append(key, value.toString());
			});

			const result = await submitContactForm(formData);

			if (result.success) {
				toast({
					title: "Message sent!",
					description: "We'll get back to you as soon as possible.",
				});
				form.reset();
				onSuccess?.(result.data!);
			} else {
				toast({
					title: "Error",
					description: result.error || "Something went wrong. Please try again.",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Something went wrong. Please try again.",
				variant: "destructive",
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className={className}>
				<div className="grid gap-6">
					{/* Name Field */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Your name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Email Field */}
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input type="email" placeholder="your@email.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Reason Field */}
					<FormField
						control={form.control}
						name="reason"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Reason for Contact</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a reason" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{contactReasonOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Subject Field */}
					<FormField
						control={form.control}
						name="subject"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Subject</FormLabel>
								<FormControl>
									<Input placeholder="What's this about?" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Optional Fields */}
					{showOptionalFields && (
						<>
							{/* Company Field */}
							<FormField
								control={form.control}
								name="company"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Company (Optional)</FormLabel>
										<FormControl>
											<Input placeholder="Your company name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Phone Field */}
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone (Optional)</FormLabel>
										<FormControl>
											<Input type="tel" placeholder="Your phone number" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</>
					)}

					{/* Message Field */}
					<FormField
						control={form.control}
						name="message"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Message</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Tell us how we can help..."
										className="min-h-[150px]"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Newsletter Opt-in */}
					<FormField
						control={form.control}
						name="newsletter"
						render={({ field }) => (
							<FormItem className="flex flex-row items-start space-x-3 space-y-0">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<div className="space-y-1 leading-none">
									<FormLabel>Stay Updated</FormLabel>
									<FormDescription>
										Receive occasional updates about new features and announcements.
									</FormDescription>
								</div>
							</FormItem>
						)}
					/>
				</div>

				<Button
					type="submit"
					className="mt-8 w-full"
					disabled={form.formState.isSubmitting}
				>
					{form.formState.isSubmitting ? "Sending..." : "Send Message"}
				</Button>
			</form>
		</Form>
	);
}

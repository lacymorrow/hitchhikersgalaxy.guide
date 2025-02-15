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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm } from "@/server/actions/contact";
import { type ContactFormData, contactFormSchema } from "@/types/contact";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface ContactFormProps {
	/** Optional default values for the form */
	defaultValues?: Partial<ContactFormData>;
	/** Optional callback when form is submitted successfully */
	onSuccess?: (data: ContactFormData) => void;
	/** Custom class name for the form container */
	className?: string;
}

export function ContactForm({
	defaultValues,
	onSuccess,
	className,
}: ContactFormProps) {
	const { toast } = useToast();

	const form = useForm<ContactFormData>({
		resolver: zodResolver(contactFormSchema),
		defaultValues: {
			name: "",
			contactInfo: "",
			message: "",
			newsletter: false,
			...defaultValues,
		},
	});

	async function onSubmit(data: ContactFormData) {
		try {
			const formData = new FormData();
			for (const [key, value] of Object.entries(data)) {
				formData.append(key, value?.toString() ?? "");
			}

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

					{/* Contact Info Field */}
					<FormField
						control={form.control}
						name="contactInfo"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									Contact Info{" "}
									<span className="text-xs text-muted-foreground">(email or phone number, optional)</span>
								</FormLabel>
								<FormControl>
									<Input placeholder="your@email.com or phone number" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

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

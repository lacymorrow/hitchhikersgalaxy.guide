"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { updateSettings } from "@/server/actions/settings";
import { useTheme } from "next-themes";
import * as React from "react";
import { toast } from "sonner";

const themes = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

type Theme = (typeof themes)[number]["value"];

export default function PreferencesPage() {
	const [isPending, startTransition] = React.useTransition();
	const { theme, setTheme } = useTheme();

	function onSubmit(formData: FormData) {
		const newTheme = formData.get("theme") as Theme;

		startTransition(async () => {
			try {
				const result = await updateSettings({
					theme: newTheme,
					emailNotifications: true, // Keep existing notification settings
				});
				if (!result.success) {
					toast.error(result.error ?? "Failed to update preferences");
					return;
				}
				setTheme(newTheme);
				toast.success(result.message);
			} catch (error) {
				console.error("Preferences update error:", error);
				toast.error("An unexpected error occurred");
			}
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Preferences</h3>
				<p className="text-sm text-muted-foreground">
					Customize your application experience.
				</p>
			</div>
			<Separator />
			<form action={onSubmit}>
				<Card>
					<CardHeader>
						<CardTitle>Theme</CardTitle>
						<CardDescription>
							Choose how the application looks and feels.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<RadioGroup
							defaultValue={theme ?? "system"}
							name="theme"
							className="grid grid-cols-3 gap-4"
						>
							{themes.map((theme) => (
								<div key={theme.value}>
									<RadioGroupItem
										value={theme.value}
										id={theme.value}
										className="peer sr-only"
									/>
									<Label
										htmlFor={theme.value}
										className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
									>
										<span>{theme.label}</span>
									</Label>
								</div>
							))}
						</RadioGroup>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving..." : "Save Changes"}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}

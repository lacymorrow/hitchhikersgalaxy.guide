"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { deleteAccount } from "@/server/actions/settings";
import { signOut } from "next-auth/react";
import * as React from "react";
import { toast } from "sonner";

export default function AccountPage() {
	const [isPending, startTransition] = React.useTransition();
	const [isOpen, setIsOpen] = React.useState(false);

	function handleDeleteAccount() {
		if (isPending) return;

		startTransition(async () => {
			try {
				const result = await deleteAccount();

				if (!result.success) {
					toast.error(result.error ?? "Failed to delete account");
					return;
				}

				toast.success(result.message);

				// Sign out and redirect to home page
				await signOut({ callbackUrl: "/" });
			} catch (error) {
				console.error("Delete account error:", error);
				toast.error("An unexpected error occurred");
			} finally {
				setIsOpen(false);
			}
		});
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Account</h3>
				<p className="text-sm text-muted-foreground">
					Manage your account settings.
				</p>
			</div>
			<Separator />
			<Card>
				<CardHeader>
					<CardTitle>Delete Account</CardTitle>
					<CardDescription>
						Permanently delete your account and all associated data.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						This action cannot be undone. All your data will be permanently
						deleted.
					</p>
				</CardContent>
				<CardFooter>
					<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
						<AlertDialogTrigger asChild>
							<Button variant="destructive">Delete Account</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete
									your account and remove all associated data from our servers.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel disabled={isPending}>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteAccount}
									disabled={isPending}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
								>
									{isPending ? "Deleting..." : "Delete Account"}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</CardFooter>
			</Card>
		</div>
	);
}

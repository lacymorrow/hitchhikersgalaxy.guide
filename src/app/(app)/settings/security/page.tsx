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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import * as React from "react";
import { toast } from "sonner";

export default function SecurityPage() {
	const [isPending, startTransition] = React.useTransition();
	const { data: session } = useSession();

	const [passwords, setPasswords] = React.useState({
		current: "",
		new: "",
		confirm: "",
	});

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswords((prev) => ({ ...prev, [name]: value }));
	};

	function onSubmit(formData: FormData) {
		// Password change will be implemented in a future update
		toast.info("Password changes will be available in a future update");
	}

	const connectedAccounts = [
		{
			name: "GitHub",
			connected: !!session?.user?.githubUsername,
			username: session?.user?.githubUsername,
		},
		{
			name: "GitLab",
			connected: false,
			username: null,
		},
		{
			name: "Bitbucket",
			connected: false,
			username: null,
		},
		// Add more providers here as they become available
	];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Security (Demo)</h3>
				<p className="text-sm text-muted-foreground">
					Manage your account security settings.
				</p>
			</div>
			<Separator />


			{/* Password Change - Coming Soon */}
			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>
						Update your password to keep your account secure.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="current">Current Password</Label>
						<Input
							id="current"
							name="current"
							type="password"
							value={passwords.current}
							onChange={handlePasswordChange}
							disabled
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="new">New Password</Label>
						<Input
							id="new"
							name="new"
							type="password"
							value={passwords.new}
							onChange={handlePasswordChange}
							disabled
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm">Confirm New Password</Label>
						<Input
							id="confirm"
							name="confirm"
							type="password"
							value={passwords.confirm}
							onChange={handlePasswordChange}
							disabled
						/>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						type="submit"
						disabled={true}
						onClick={() =>
							toast.info(
								"Password changes will be available in a future update",
							)
						}
					>
						Coming Soon
					</Button>
				</CardFooter>
			</Card>

			{/* Two-Factor Authentication - Coming Soon */}
			<Card>
				<CardHeader>
					<CardTitle>Two-Factor Authentication</CardTitle>
					<CardDescription>
						Add an extra layer of security to your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Two-factor authentication adds an extra layer of security to your
						account by requiring more than just a password to sign in.
					</p>
				</CardContent>
				<CardFooter>
					<Button
						variant="outline"
						onClick={() =>
							toast.info("2FA will be available in a future update")
						}
						disabled
					>
						Coming Soon
					</Button>
				</CardFooter>
			</Card>


			{/* Connected Accounts */}
			<Card>
				<CardHeader>
					<CardTitle>Connected Accounts</CardTitle>
					<CardDescription>
						Manage your connected accounts and authentication methods.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{connectedAccounts.map((account) => (
						<div
							key={account.name}
							className="flex items-center justify-between space-x-4"
						>
							<div className="flex flex-col space-y-1">
								<span className="font-medium">{account.name}</span>
								{account.connected ? (
									<span className="text-sm text-muted-foreground">
										Connected as {account.username}
									</span>
								) : (
									<span className="text-sm text-muted-foreground">
										Not connected
									</span>
								)}
							</div>
							<Button
								variant={account.connected ? "outline" : "default"}
								onClick={() =>
									toast.info(
										`${account.name} connection management will be available in a future update`,
									)
								}
							>
								{account.connected ? "Disconnect" : "Connect"}
							</Button>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

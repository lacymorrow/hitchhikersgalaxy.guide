"use client";

import * as React from "react";
import { toast } from "sonner";
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

export default function SecurityPage() {
	const [passwords, setPasswords] = React.useState({
		current: "",
		new: "",
		confirm: "",
	});

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswords((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Security</h3>
				<p className="text-sm text-muted-foreground">Manage your account security settings.</p>
			</div>
			<Separator />

			{/* Password Change - Coming Soon */}
			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>Update your password to keep your account secure.</CardDescription>
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
						onClick={() => toast.info("Password changes will be available in a future update")}
					>
						Coming Soon
					</Button>
				</CardFooter>
			</Card>

			{/* Two-Factor Authentication - Coming Soon */}
			<Card>
				<CardHeader>
					<CardTitle>Two-Factor Authentication</CardTitle>
					<CardDescription>Add an extra layer of security to your account.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Two-factor authentication adds an extra layer of security to your account by requiring
						more than just a password to sign in.
					</p>
				</CardContent>
				<CardFooter>
					<Button
						variant="outline"
						onClick={() => toast.info("2FA will be available in a future update")}
						disabled
					>
						Coming Soon
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

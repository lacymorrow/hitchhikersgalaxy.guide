"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Facebook, Rocket, Share } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { guideQuotes } from "@/lib/constants/quotes";

// Custom X (formerly Twitter) icon
function XIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M4 4l11.733 16h4.267l-11.733-16z" />
			<path d="M4 20l6.768-8.309" />
			<path d="M13.267 11.691L20 4" />
		</svg>
	);
}

// Custom TikTok icon
function TikTokIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
		</svg>
	);
}

// Custom Bluesky icon
function BlueskyIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M12 4L4 8l8 4 8-4-8-4z" />
			<path d="M4 12l8 4 8-4" />
			<path d="M4 16l8 4 8-4" />
		</svg>
	);
}

interface ShareButtonProps {
	title?: string;
	url?: string;
	variant?: "default" | "subtle";
}

export function ShareButton({ title, url, variant = "default" }: ShareButtonProps) {
	const [open, setOpen] = useState(false);
	const [showTowel, setShowTowel] = useState(false);
	const [quote, setQuote] = useState(guideQuotes[0]);
	const [canNativeShare, setCanNativeShare] = useState(false);
	const { toast } = useToast();
	const shareUrl = url || typeof window !== "undefined" ? window.location.href : "";
	const shareTitle = title || "The Hitchhiker's Guide to the Galaxy";

	// Check if native sharing is available
	useEffect(() => {
		setCanNativeShare(
			typeof navigator !== "undefined" && !!navigator.share
		);
	}, []);

	// Random towel reminder
	useEffect(() => {
		const interval = setInterval(() => {
			if (Math.random() < 0.1) { // 10% chance every 10 seconds
				setShowTowel(true);
				setTimeout(() => setShowTowel(false), 3000);
			}
		}, 10000);
		return () => clearInterval(interval);
	}, []);

	// Change quote when dialog opens
	useEffect(() => {
		if (open) {
			setQuote(guideQuotes[Math.floor(Math.random() * guideQuotes.length)]);
		}
	}, [open]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl);
			toast({
				title: "Sub-Etha Network Transmission Complete!",
				description: "The coordinates have been copied to your local data matrix.",
				className: "bg-green-500/10 text-green-500 border-green-500/20",
			});
		} catch (error) {
			toast({
				title: "Transmission Failed",
				description: "The Babel fish seems to be having trouble. Please try again.",
				variant: "destructive",
			});
		}
	};

	const handleNativeShare = async () => {
		try {
			await navigator.share({
				title: shareTitle,
				text: `Check out this entry in the Hitchhiker's Guide to the Galaxy: ${shareTitle}`,
				url: shareUrl,
			});
			toast({
				title: "Sub-Etha Network Transmission Complete!",
				description: "The coordinates have been shared across the galaxy.",
				className: "bg-green-500/10 text-green-500 border-green-500/20",
			});
			setOpen(false);
		} catch (error) {
			// User cancelled or sharing failed
			if ((error as Error)?.name !== "AbortError") {
				toast({
					title: "Transmission Failed",
					description: "The Babel fish seems to be having trouble. Please try again.",
					variant: "destructive",
				});
			}
		}
	};

	const handleShare = async (platform: string) => {
		const text = `Check out this entry in the Hitchhiker's Guide to the Galaxy: ${shareTitle}`;
		const encodedText = encodeURIComponent(text);
		const encodedUrl = encodeURIComponent(shareUrl);

		let shareLink = "";
		switch (platform) {
			case "x":
				shareLink = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
				break;
			case "facebook":
				shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
				break;
			case "tiktok":
				// TikTok doesn't have a direct share URL, but we can open the app/website
				shareLink = `https://www.tiktok.com/upload?url=${encodedUrl}`;
				break;
			case "bluesky":
				// Bluesky doesn't have a web share URL yet, but we can open the app
				shareLink = `https://bsky.app/intent/post?text=${encodedText}%20${encodedUrl}`;
				break;
			default:
				return;
		}

		window.open(shareLink, "_blank", "width=600,height=400");
		setOpen(false);
	};

	return (
		<div className="relative">

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					{variant === "subtle" ? (
						<button
							className="text-inherit hover:text-green-500 transition-colors"
							onClick={() => setOpen(true)}
						>
							Share & Enjoy
						</button>
					) : (
						<Button
							variant="outline"
							className="relative border-green-500 text-green-500 hover:bg-green-500/10"
						>
							<motion.div
								className="absolute inset-0 pointer-events-none"
								initial={{ opacity: 0 }}
								animate={{
									opacity: [0, 0.1, 0],
								}}
								transition={{
									duration: 10,
									repeat: Infinity,
									ease: "linear",
								}}
							>
								<div className="h-full w-full rounded-lg border-2 border-dashed border-green-500" />
							</motion.div>
							<Share2 className="mr-2 h-4 w-4" />
							Share Across the Galaxy
						</Button>
					)}
				</DialogTrigger>
				<DialogContent className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 border-green-500 bg-black sm:max-w-md">
					<motion.div
						className="absolute -top-6 -right-6 z-50 text-4xl"
						animate={{
							y: [0, -10, 0],
							rotate: [0, -10, 0, 10, 0],
						}}
						transition={{
							duration: 4,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					>
						🚀
					</motion.div>
					<DialogHeader>
						<DialogTitle className="text-green-500">
							Sub-Etha Network Transmission
						</DialogTitle>
						<DialogDescription className="text-green-400/60">
							Share this knowledge with other hitchhikers across the galaxy.
							Don't forget your towel!
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-4">
						<motion.div
							className="flex items-center gap-2"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
						>
							<Input
								readOnly
								value={shareUrl}
								className="border-green-500/20 bg-black text-green-400 focus-visible:ring-green-500"
							/>
							<Button
								variant="outline"
								size="icon"
								className="relative border-green-500 text-green-500 hover:bg-green-500/10"
								onClick={handleCopy}
							>
								<motion.div
									animate={{
										scale: [1, 1.2, 1],
									}}
									transition={{
										duration: 2,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								>
									<Copy className="h-4 w-4" />
								</motion.div>
							</Button>
						</motion.div>
						<motion.div
							className="flex flex-wrap justify-center gap-2"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 }}
						>
							{canNativeShare && (
								<Button
									variant="outline"
									className="group flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
									onClick={handleNativeShare}
								>
									<motion.div
										animate={{
											rotate: [0, 10, -10, 0],
										}}
										transition={{
											duration: 1,
											repeat: Infinity,
											repeatDelay: 2,
										}}
									>
										<Share className="mr-2 h-4 w-4" />
									</motion.div>
									Share
								</Button>
							)}
							<Button
								variant="outline"
								className="group flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
								onClick={() => handleShare("x")}
							>
								<motion.div
									animate={{
										rotate: [0, 10, -10, 0],
									}}
									transition={{
										duration: 1,
										repeat: Infinity,
										repeatDelay: 2,
									}}
								>
									<XIcon className="mr-2 h-4 w-4" />
								</motion.div>
								X
							</Button>
							<Button
								variant="outline"
								className="group flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
								onClick={() => handleShare("facebook")}
							>
								<motion.div
									animate={{
										rotate: [0, -10, 10, 0],
									}}
									transition={{
										duration: 1,
										repeat: Infinity,
										repeatDelay: 2,
									}}
								>
									<Facebook className="mr-2 h-4 w-4" />
								</motion.div>
								Facebook
							</Button>
							<Button
								variant="outline"
								className="group flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
								onClick={() => handleShare("tiktok")}
							>
								<motion.div
									animate={{
										rotate: [0, -10, 10, 0],
									}}
									transition={{
										duration: 1,
										repeat: Infinity,
										repeatDelay: 2,
									}}
								>
									<TikTokIcon className="mr-2 h-4 w-4" />
								</motion.div>
								TikTok
							</Button>
							<Button
								variant="outline"
								className="group flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
								onClick={() => handleShare("bluesky")}
							>
								<motion.div
									animate={{
										rotate: [0, -10, 10, 0],
									}}
									transition={{
										duration: 1,
										repeat: Infinity,
										repeatDelay: 2,
									}}
								>
									<BlueskyIcon className="mr-2 h-4 w-4" />
								</motion.div>
								Bluesky
							</Button>
						</motion.div>
					</div>
					<motion.div
						className="text-center text-sm text-green-400/60"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.6 }}
					>
						<motion.div
							className="relative overflow-hidden"
							animate={{ opacity: [0.6, 1, 0.6] }}
							transition={{
								duration: 4,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						>
							<motion.div
								className="absolute inset-0 -z-10"
								animate={{
									backgroundPosition: ["0% 0%", "100% 100%"],
								}}
								transition={{
									duration: 8,
									repeat: Infinity,
									ease: "linear",
								}}
								style={{
									background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(0,0,0,0) 70%)",
								}}
							/>
							{quote}
							<div className="mt-1 text-xs">- The Guide</div>
						</motion.div>
					</motion.div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

import {
	AlertCircle,
	Box,
	Download,
	GitBranch,
	GitPullRequest,
	type LucideIcon,
	Star,
} from "lucide-react";

export const recentActivity = [
	{
		id: "1",
		type: "download",
		title: "Downloaded v1.2.0",
		time: "2 minutes ago",
		user: {
			name: "Sarah Chen",
			avatar: "https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png",
		},
	},
	{
		id: "2",
		type: "star",
		title: "Starred the repository",
		time: "1 hour ago",
		user: {
			name: "Michael Kim",
			avatar: "https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/02.png",
		},
	},
	{
		id: "3",
		type: "pr",
		title: "Merged PR #234: Add TypeScript types",
		time: "3 hours ago",
		user: {
			name: "David Singh",
			avatar: "https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/03.png",
		},
	},
];

export const activityIcons: Record<string, LucideIcon> = {
	download: Download,
	star: Star,
	fork: GitBranch,
	issue: AlertCircle,
	pr: GitPullRequest,
	release: Box,
};

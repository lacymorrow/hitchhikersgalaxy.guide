import {
	Activity,
	AlertCircle,
	Box,
	CreditCard,
	DollarSign,
	Download,
	GitBranch,
	GitPullRequest,
	type LucideIcon,
	Star,
	Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Activity feed icons
// ---------------------------------------------------------------------------
export const activityIcons: Record<string, LucideIcon> = {
	download: Download,
	star: Star,
	fork: GitBranch,
	issue: AlertCircle,
	pr: GitPullRequest,
	release: Box,
};

// ---------------------------------------------------------------------------
// Stats cards
// ---------------------------------------------------------------------------
export interface StatItem {
	title: string;
	value: string;
	change: string;
	Icon: LucideIcon;
}

export const stats: StatItem[] = [
	{
		title: "Total Revenue",
		value: "$45,231.89",
		change: "+20.1% from last month",
		Icon: DollarSign,
	},
	{
		title: "Subscriptions",
		value: "+2,350",
		change: "+180.1% from last month",
		Icon: Users,
	},
	{
		title: "Sales",
		value: "+12,234",
		change: "+19% from last month",
		Icon: CreditCard,
	},
	{
		title: "Active Now",
		value: "+573",
		change: "+201 since last hour",
		Icon: Activity,
	},
];

// ---------------------------------------------------------------------------
// Recent sales
// ---------------------------------------------------------------------------
export interface SaleItem {
	id: string;
	name: string;
	email: string;
	amount: string;
	avatar: string;
	fallback: string;
}

export const sales: SaleItem[] = [
	{
		id: "sale-1",
		name: "Olivia Martin",
		email: "olivia.martin@email.com",
		amount: "+$1,999.00",
		avatar: "/avatars/01.png",
		fallback: "OM",
	},
	{
		id: "sale-2",
		name: "Jackson Lee",
		email: "jackson.lee@email.com",
		amount: "+$39.00",
		avatar: "/avatars/02.png",
		fallback: "JL",
	},
	{
		id: "sale-3",
		name: "Isabella Nguyen",
		email: "isabella.nguyen@email.com",
		amount: "+$299.00",
		avatar: "/avatars/03.png",
		fallback: "IN",
	},
	{
		id: "sale-4",
		name: "William Kim",
		email: "will@email.com",
		amount: "+$99.00",
		avatar: "/avatars/04.png",
		fallback: "WK",
	},
	{
		id: "sale-5",
		name: "Sofia Davis",
		email: "sofia.davis@email.com",
		amount: "+$39.00",
		avatar: "/avatars/05.png",
		fallback: "SD",
	},
];

// ---------------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------------
export type TeamStatus = "active" | "away" | "offline";

export interface TeamMember {
	id: string;
	name: string;
	role: string;
	status: TeamStatus;
	lastActive: string;
}

export const teamMembers: TeamMember[] = [
	{ id: "tm-1", name: "Liam Chen", role: "Lead Engineer", status: "active", lastActive: "Just now" },
	{ id: "tm-2", name: "Sarah Park", role: "Designer", status: "active", lastActive: "5 min ago" },
	{ id: "tm-3", name: "Marcus Reed", role: "Backend Dev", status: "away", lastActive: "1 hour ago" },
	{ id: "tm-4", name: "Aisha Patel", role: "Product Manager", status: "active", lastActive: "12 min ago" },
	{ id: "tm-5", name: "Tom Varga", role: "DevOps", status: "offline", lastActive: "3 hours ago" },
];

export const statusVariant = (status: TeamStatus) => {
	switch (status) {
		case "active":
			return "default" as const;
		case "away":
			return "secondary" as const;
		case "offline":
			return "outline" as const;
	}
};

// ---------------------------------------------------------------------------
// Page analytics
// ---------------------------------------------------------------------------
export const pageViewsData = [
	{ month: "Jan", views: 4500 },
	{ month: "Feb", views: 3800 },
	{ month: "Mar", views: 5200 },
	{ month: "Apr", views: 4900 },
	{ month: "May", views: 6100 },
	{ month: "Jun", views: 7200 },
];

export const bounceRateData = [
	{ month: "Jan", rate: 42 },
	{ month: "Feb", rate: 38 },
	{ month: "Mar", rate: 35 },
	{ month: "Apr", rate: 40 },
	{ month: "May", rate: 32 },
	{ month: "Jun", rate: 28 },
];

"use client";

import type { BlogPost } from "@/lib/blog";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface BlogSidebarProps {
	posts: BlogPost[];
}

interface FolderStructure {
	[key: string]: {
		posts: BlogPost[];
		subfolders: FolderStructure;
	};
}

export const BlogSidebar = ({ posts }: BlogSidebarProps) => {
	const pathname = usePathname();
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

	// Build folder structure from posts
	const folderStructure: FolderStructure = {};
	for (const post of posts) {
		const parts = post.slug.split("/");
		let current = folderStructure;

		// Handle posts in root
		if (parts.length === 1) {
			if (!current.root) {
				current.root = { posts: [], subfolders: {} };
			}
			current.root.posts.push(post);
			continue;
		}

		// Handle posts in subfolders
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!part) continue;

			if (!current[part]) {
				current[part] = { posts: [], subfolders: {} };
			}
			current = current[part].subfolders;
		}

		// Add post to its folder
		const folder = parts[parts.length - 2];
		if (!folder) continue;

		if (!current[folder]) {
			current[folder] = { posts: [], subfolders: {} };
		}
		current[folder].posts.push(post);
	}

	const toggleFolder = (path: string) => {
		const newExpanded = new Set(expandedFolders);
		if (newExpanded.has(path)) {
			newExpanded.delete(path);
		} else {
			newExpanded.add(path);
		}
		setExpandedFolders(newExpanded);
	};

	const renderFolder = (
		structure: FolderStructure,
		path = "",
		level = 0
	) => {
		return Object.entries(structure).map(([name, { posts, subfolders }]) => {
			const currentPath = path ? `${path}/${name}` : name;
			const hasContent = posts.length > 0 || Object.keys(subfolders).length > 0;
			if (!hasContent) return null;

			return (
				<div key={currentPath} style={{ marginLeft: level * 12 }}>
					<button
						type="button"
						onClick={() => toggleFolder(currentPath)}
						className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						{name === "root" ? "Blog Posts" : name}
						{(posts.length > 0 || Object.keys(subfolders).length > 0) && (
							<ChevronDownIcon
								className={cn(
									"h-4 w-4 transition-transform",
									expandedFolders.has(currentPath) && "rotate-180"
								)}
							/>
						)}
					</button>
					{expandedFolders.has(currentPath) && (
						<>
							{posts.map((post) => {
								const isActive = pathname === `/blog/${post.slug}`;
								return (
									<Link
										key={post.slug}
										href={`/blog/${post.slug}`}
										className={cn(
											"ml-4 block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
											isActive && "bg-muted font-medium text-foreground",
											!isActive && "text-muted-foreground"
										)}
									>
										{post.title}
									</Link>
								);
							})}
							{renderFolder(subfolders, currentPath, level + 1)}
						</>
					)}
				</div>
			);
		});
	};

	return (
		<aside className="hidden w-64 shrink-0 border-r bg-muted/40 lg:block">
			<div className="sticky top-0 h-screen overflow-y-auto p-4">
				<nav className="flex flex-col gap-2">
					<div className="flex items-center justify-between px-2 text-sm font-semibold text-muted-foreground">
						<span>Navigation</span>
						<Link
							href="/blog/categories"
							className="text-xs hover:text-foreground"
						>
							View Categories
						</Link>
					</div>
					{renderFolder(folderStructure)}
				</nav>
			</div>
		</aside>
	);
};

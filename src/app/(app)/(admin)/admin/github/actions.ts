"use server";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import {
  grantGitHubAccess,
  pendingCollaboratorEmail,
  revokeGitHubAccess,
} from "@/server/services/github/github-service";

export async function revokeGitHubAccessAction(userId: string) {
  try {
    await revokeGitHubAccess(userId);
    return { success: true };
  } catch (error) {
    console.error("Failed to revoke GitHub access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function addCollaboratorAction(githubUsername: string) {
  try {
    if (!githubUsername?.trim()) {
      return { success: false, error: "GitHub username is required" };
    }
    const trimmed = githubUsername.trim();
    await grantGitHubAccess({ githubUsername: trimmed });

    // Insert a stub user so the invite can be revoked before acceptance
    await db
      ?.insert(users)
      .values({
        email: pendingCollaboratorEmail(trimmed),
        name: trimmed,
        githubUsername: trimmed,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { githubUsername: trimmed, updatedAt: new Date() },
      });

    return { success: true };
  } catch (error) {
    console.error("Failed to add collaborator:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    const isBadCredentials =
      message.toLowerCase().includes("bad credentials") || message.includes("401");
    return {
      success: false,
      error: isBadCredentials
        ? "Bad credentials — check that GITHUB_ACCESS_TOKEN is set and has the 'repo' scope."
        : message,
    };
  }
}

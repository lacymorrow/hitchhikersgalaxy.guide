import { logger } from "@/lib/logger";
import { db, isDatabaseInitialized } from "@/server/db";
import { projectMembers, teamMembers, userFiles, users } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { BaseService } from "./base-service";
import { PaymentService } from "./payment-service";
import { teamService } from "./team-service";
import { apiKeyService } from "./api-key-service";
import { deleteFromS3 } from "./s3";

export class UserService extends BaseService<typeof users> {
	constructor() {
		super({
			table: users,
			idField: "id",
			softDelete: true,
		});
	}

	/**
	 * Creates a personal team for a new user.
	 * @param userId - The ID of the user.
	 * @returns The created personal team.
	 */
	private async createPersonalTeam(userId: string) {
		return teamService.createPersonalTeam(userId);
	}

	/**
	 * Ensures a user exists in the database, creating them if necessary.
	 * Also checks and links any existing payments.
	 * @param authUser - The authenticated user object.
	 * @returns The database user object.
	 */
	async ensureUserExists(authUser: {
		id: string;
		email: string;
		name?: string | null;
		image?: string | null;
	}) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		let dbUser = await db?.query.users.findFirst({
			where: eq(users.id, authUser.id),
		});

		if (!dbUser) {
			if (!authUser.email) {
				throw new Error("User does not have a primary email");
			}

			const [newUser] = await db
				.insert(users)
				.values({
					id: authUser.id,
					email: authUser.email,
					name: authUser.name ?? null,
					image: authUser.image ?? null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			if (newUser) {
				// Create personal team for new user
				await this.createPersonalTeam(newUser.id);

				// Create an API key for the user
				const apiKey = await apiKeyService.createApiKey({
					userId: newUser.id,
					name: "Default API Key",
					description: "Created automatically on user registration",
				});

				logger.info("Created default API key for new user", {
					userId: newUser.id,
					apiKeyId: apiKey.id,
				});

				// Check for existing payments
				const hasPaid = await PaymentService.getUserPaymentStatus(newUser.id);
				if (hasPaid) {
					logger.info("Found existing payment for new user", {
						userId: newUser.id,
					});
				}

				dbUser = newUser;
			} else {
				throw new Error(`Failed to create user: ${authUser.id}`);
			}
		} else {
			// Check if user has an API key, create one if they don't
			const userApiKeys = await apiKeyService.getUserApiKeys(dbUser.id);
			if (userApiKeys.length === 0) {
				const apiKey = await apiKeyService.createApiKey({
					userId: dbUser.id,
					name: "Default API Key",
					description: "Created automatically on first login",
				});

				logger.info("Created default API key for existing user", {
					userId: dbUser.id,
					apiKeyId: apiKey.id,
				});
			}

			// Check for existing payments for existing users too
			const hasPaid = await PaymentService.getUserPaymentStatus(dbUser.id);
			if (hasPaid) {
				logger.info("Found existing payment for existing user", {
					userId: dbUser.id,
				});
			}
		}

		return dbUser;
	}

	/**
	 * Gets all projects associated with a user.
	 * @param userId - The ID of the user.
	 * @returns A list of projects with their details.
	 */
	async getUserProjects(userId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.projectMembers.findMany({
			where: eq(projectMembers.userId, userId),
			with: {
				project: {
					with: {
						team: true,
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Gets all teams associated with a user.
	 * @param userId - The ID of the user.
	 * @returns A list of teams with their details.
	 */
	async getUserTeams(userId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.teamMembers.findMany({
			where: eq(teamMembers.userId, userId),
			with: {
				team: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Gets a user by their email address.
	 * @param email - The email address to look up.
	 * @returns The user if found, null otherwise.
	 */
	async getUserByEmail(email: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.users.findFirst({
			where: eq(users.email, email),
		});
	}

	/**
	 * Gets a user with all their associations.
	 * @param userId - The ID of the user.
	 * @returns The user with their teams and projects.
	 */
	async getUserWithAssociations(userId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.users.findFirst({
			where: eq(users.id, userId),
			with: {
				teamMembers: {
					with: {
						team: true,
					},
				},
				projectMembers: {
					with: {
						project: {
							with: {
								team: true,
							},
						},
					},
				},
			},
		});
	}

	/**
	 * Updates a user's profile information.
	 * @param userId - The ID of the user.
	 * @param data - The data to update.
	 * @returns The updated user.
	 */
	async updateProfile(
		userId: string,
		data: {
			name?: string | null;
			image?: string | null;
		}
	) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const user = await this.update(userId, {
			...data,
			updatedAt: new Date(),
		});

		return user;
	}

	/**
	 * Verifies a user's email address.
	 * @param userId - The ID of the user.
	 * @returns The updated user.
	 */
	async verifyEmail(userId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const user = await this.update(userId, {
			emailVerified: new Date(),
			updatedAt: new Date(),
		});

		return user;
	}

	/**
	 * Gets all users in a team.
	 * @param teamId - The ID of the team.
	 * @returns A list of users with their roles.
	 */
	async getTeamUsers(teamId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.teamMembers.findMany({
			where: eq(teamMembers.teamId, teamId),
			with: {
				user: true,
			},
		});
	}

	/**
	 * Gets all users in a project.
	 * @param projectId - The ID of the project.
	 * @returns A list of users with their roles.
	 */
	async getProjectUsers(projectId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		return db.query.projectMembers.findMany({
			where: eq(projectMembers.projectId, projectId),
			with: {
				user: true,
			},
		});
	}

	/**
	 * Checks if a user has access to a team.
	 * @param userId - The ID of the user.
	 * @param teamId - The ID of the team.
	 * @returns True if the user has access.
	 */
	async hasTeamAccess(userId: string, teamId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const member = await db?.query.teamMembers.findFirst({
			where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
		});

		return !!member;
	}

	/**
	 * Checks if a user has access to a project.
	 * @param userId - The ID of the user.
	 * @param projectId - The ID of the project.
	 * @returns True if the user has access.
	 */
	async hasProjectAccess(userId: string, projectId: string) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const member = await db?.query.projectMembers.findFirst({
			where: and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)),
		});

		return !!member;
	}

	/**
	 * Adds a file to a user's profile
	 * @param userId - The ID of the user
	 * @param file - The file information
	 * @returns The created file record
	 */
	async addUserFile(userId: string, file: { title: string; location: string }) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		const [newFile] = await db
			.insert(userFiles)
			.values({
				userId,
				title: file.title,
				location: file.location,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		logger.info("Added file to user profile", {
			userId,
			fileId: newFile.id,
			title: file.title,
		});

		return newFile;
	}

	/**
	 * Deletes a file from a user's profile
	 * @param userId - The ID of the user
	 * @param fileId - The ID of the file to delete
	 */
	async deleteUserFile(userId: string, fileId: number) {
		if (!isDatabaseInitialized()) {
			throw new Error("Database is not initialized");
		}

		if (!db) {
			throw new Error("Database is not initialized");
		}

		// First, get the file to check ownership and get the location
		const file = await db.query.userFiles.findFirst({
			where: and(
				eq(userFiles.id, fileId),
				eq(userFiles.userId, userId)
			),
		});

		if (!file) {
			throw new Error("File not found or access denied");
		}

		// Delete from S3 first
		try {
			const fileName = file.location.split("/").pop();
			if (fileName) {
				await deleteFromS3(fileName);
			}
		} catch (error) {
			logger.error("Failed to delete file from S3", {
				error,
				fileId,
				location: file.location,
			});
			// Continue with database deletion even if S3 deletion fails
		}

		// Delete from database
		await db
			.delete(userFiles)
			.where(and(
				eq(userFiles.id, fileId),
				eq(userFiles.userId, userId)
			));

		logger.info("Deleted file from user profile", {
			userId,
			fileId,
		});
	}
}

// Export a singleton instance
export const userService = new UserService();

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeploymentActions } from "@/app/(app)/(dashboard)/deployments/deployment-actions";
import { deleteDeployment } from "@/server/actions/deployment-actions";
import type { Deployment } from "@/server/db/schema";

// Mock server actions
vi.mock("@/server/actions/deployment-actions", () => ({
	deleteDeployment: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh: vi.fn(),
	}),
}));

describe("DeploymentActions", () => {
	const mockDeployment: Deployment = {
		id: "test-id",
		userId: "user-id",
		projectName: "Test Project",
		description: "Test Description",
		status: "completed",
		deployUrl: "https://test.vercel.app",
		vercelProjectId: "vercel-id",
		githubUrl: "https://github.com/test/repo",
		error: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should render deployment actions dropdown", () => {
		render(<DeploymentActions deployment={mockDeployment} />);

		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		expect(dropdownTrigger).toBeInTheDocument();
	});

	it("should show view deployment option when deployUrl exists", () => {
		render(<DeploymentActions deployment={mockDeployment} />);

		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		const viewOption = screen.getByText("View Deployment");
		expect(viewOption).toBeInTheDocument();
	});

	it("should not show view deployment option when deployUrl is missing", () => {
		const deploymentWithoutUrl = { ...mockDeployment, deployUrl: null };
		render(<DeploymentActions deployment={deploymentWithoutUrl} />);

		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		const viewOption = screen.queryByText("View Deployment");
		expect(viewOption).not.toBeInTheDocument();
	});

	it("should show view on GitHub option when githubUrl exists", () => {
		render(<DeploymentActions deployment={mockDeployment} />);

		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		const githubOption = screen.getByText("View on GitHub");
		expect(githubOption).toBeInTheDocument();
	});

	it("should open delete confirmation dialog", () => {
		render(<DeploymentActions deployment={mockDeployment} />);

		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		const deleteOption = screen.getByText("Delete");
		fireEvent.click(deleteOption);

		const confirmDialog = screen.getByText("Are you absolutely sure?");
		expect(confirmDialog).toBeInTheDocument();
	});

	it("should handle successful deletion", async () => {
		vi.mocked(deleteDeployment).mockResolvedValue(true);

		render(<DeploymentActions deployment={mockDeployment} />);

		// Open dropdown
		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		// Click delete
		const deleteOption = screen.getByText("Delete");
		fireEvent.click(deleteOption);

		// Confirm deletion
		const confirmButton = screen.getByRole("button", { name: /continue/i });
		fireEvent.click(confirmButton);

		await waitFor(() => {
			expect(deleteDeployment).toHaveBeenCalledWith("test-id");
			expect(toast.success).toHaveBeenCalledWith("Deployment deleted successfully");
		});
	});

	it("should handle deletion failure", async () => {
		vi.mocked(deleteDeployment).mockResolvedValue(false);

		render(<DeploymentActions deployment={mockDeployment} />);

		// Open dropdown
		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		// Click delete
		const deleteOption = screen.getByText("Delete");
		fireEvent.click(deleteOption);

		// Confirm deletion
		const confirmButton = screen.getByRole("button", { name: /continue/i });
		fireEvent.click(confirmButton);

		await waitFor(() => {
			expect(deleteDeployment).toHaveBeenCalledWith("test-id");
			expect(toast.error).toHaveBeenCalledWith("Failed to delete deployment");
		});
	});

	it("should handle deletion error", async () => {
		vi.mocked(deleteDeployment).mockRejectedValue(new Error("Network error"));

		render(<DeploymentActions deployment={mockDeployment} />);

		// Open dropdown
		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		// Click delete
		const deleteOption = screen.getByText("Delete");
		fireEvent.click(deleteOption);

		// Confirm deletion
		const confirmButton = screen.getByRole("button", { name: /continue/i });
		fireEvent.click(confirmButton);

		await waitFor(() => {
			expect(deleteDeployment).toHaveBeenCalledWith("test-id");
			expect(toast.error).toHaveBeenCalledWith("Failed to delete deployment");
		});
	});

	it("should close dialog when cancel is clicked", () => {
		render(<DeploymentActions deployment={mockDeployment} />);

		// Open dropdown
		const dropdownTrigger = screen.getByRole("button", { name: /open menu/i });
		fireEvent.click(dropdownTrigger);

		// Click delete
		const deleteOption = screen.getByText("Delete");
		fireEvent.click(deleteOption);

		// Click cancel
		const cancelButton = screen.getByRole("button", { name: /cancel/i });
		fireEvent.click(cancelButton);

		// Dialog should be closed
		const confirmDialog = screen.queryByText("Are you absolutely sure?");
		expect(confirmDialog).not.toBeInTheDocument();
	});
});
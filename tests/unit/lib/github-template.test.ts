import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GitHubTemplateService } from "@/lib/github-template"

const mockCreateWorkflowDispatch = vi.fn()
const mockCreateUsingTemplate = vi.fn()

vi.mock("@octokit/rest", () => ({
	Octokit: vi.fn(() => ({
		repos: {
			createUsingTemplate: mockCreateUsingTemplate,
			replaceAllTopics: vi.fn(),
		},
		actions: {
			createWorkflowDispatch: mockCreateWorkflowDispatch,
		},
	})),
}))

describe("GitHubTemplateService", () => {
	beforeEach(() => {
		mockCreateWorkflowDispatch.mockReset()
		mockCreateUsingTemplate.mockReset()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it("dispatches init-upstream workflow on provided ref", async () => {
		vi.useFakeTimers()
		mockCreateWorkflowDispatch.mockResolvedValue({})

		const service = new GitHubTemplateService({ accessToken: "token" })

		const result = service.initializeUpstreamHistory("ship-kit", "repo-name", "develop")
		await vi.advanceTimersByTimeAsync(3000)
		await result

		expect(mockCreateWorkflowDispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				owner: "ship-kit",
				repo: "repo-name",
				workflow_id: "init-upstream.yml",
				ref: "develop",
			}),
		)
	})

	it("uses the template default branch when triggering init-upstream", async () => {
		const service = new GitHubTemplateService({ accessToken: "token" })

		// Avoid waiting for timers in initializeUpstreamHistory.
		const initializeSpy = vi
			.spyOn(service, "initializeUpstreamHistory")
			.mockResolvedValue({ success: true })

		vi.spyOn(service as unknown as { verifyTemplateAccess: () => Promise<void> }, "verifyTemplateAccess")
			.mockResolvedValue(undefined)
		vi.spyOn(service as unknown as { addUpstreamInfo: () => Promise<void> }, "addUpstreamInfo")
			.mockResolvedValue(undefined)

		mockCreateUsingTemplate.mockResolvedValue({
			data: {
				html_url: "https://github.com/ship-kit/repo-name",
				id: 123,
				clone_url: "https://github.com/ship-kit/repo-name.git",
				ssh_url: "git@github.com:ship-kit/repo-name.git",
				full_name: "ship-kit/repo-name",
				default_branch: "develop",
			},
		})

		await service.createFromTemplate({
			templateOwner: "ship-kit",
			templateRepo: "shipkit",
			newRepoName: "repo-name",
			newRepoOwner: "ship-kit",
		})

		expect(initializeSpy).toHaveBeenCalledWith("ship-kit", "repo-name", "develop")
	})
})

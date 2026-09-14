import { mockAudit } from "evlog";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
}));

describe("audit-service", () => {
  let captured: ReturnType<typeof mockAudit>;

  beforeEach(() => {
    captured = mockAudit();
  });

  afterEach(() => {
    captured.restore();
    vi.unstubAllEnvs();
  });

  it("does not emit audit events when the evlog flag is off", async () => {
    vi.stubEnv("ENABLE_EVLOG", "");
    const { auditAction, recordAudit, userActor } = await import("@/server/services/audit-service");

    recordAudit(auditAction.teamCreate({ actor: userActor("user_1"), target: { id: "team_1" } }));

    expect(captured.events).toHaveLength(0);
  });

  it("emits a team.create audit event when the evlog flag is on", async () => {
    vi.stubEnv("ENABLE_EVLOG", "true");
    const { auditAction, recordAudit, userActor } = await import("@/server/services/audit-service");

    recordAudit(auditAction.teamCreate({ actor: userActor("user_1"), target: { id: "team_1" } }));

    expect(captured.events).toHaveLength(1);
    expect(captured.events[0]).toMatchObject({
      action: "team.create",
      actor: { type: "user", id: "user_1" },
      target: { type: "team", id: "team_1" },
      outcome: "success",
    });
  });

  it("never throws from recordAudit, even if the emit fails", async () => {
    vi.stubEnv("ENABLE_EVLOG", "true");
    const { recordAudit } = await import("@/server/services/audit-service");

    // Malformed input exercises the internal try/catch — audit logging must
    // never take down the mutation it observes.
    expect(() => recordAudit(undefined as never)).not.toThrow();
  });

  it("resolves the session user as actor when signed in", async () => {
    vi.stubEnv("ENABLE_EVLOG", "true");
    const { auth } = await import("@/server/auth");
    vi.mocked(auth).mockResolvedValue({ user: { id: "user_42" } } as never);
    const { resolveSessionActor } = await import("@/server/services/audit-service");

    await expect(resolveSessionActor()).resolves.toEqual({ type: "user", id: "user_42" });
  });

  it("falls back to the system actor without a session", async () => {
    vi.stubEnv("ENABLE_EVLOG", "true");
    const { auth } = await import("@/server/auth");
    vi.mocked(auth).mockResolvedValue(null as never);
    const { resolveSessionActor, systemActor } = await import("@/server/services/audit-service");

    await expect(resolveSessionActor()).resolves.toEqual(systemActor);
  });
});

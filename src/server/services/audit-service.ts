/**
 * Audit logging for entity changes (evlog trial, LAC-3361).
 *
 * Emits tamper-evident, redaction-aware audit events via evlog. Every helper
 * is a no-op while the trial flag is off, and recordAudit never throws — audit
 * logging must never take down the mutation it observes.
 *
 * Events land in the same pipeline as the rest of evlog output (console +
 * whatever drain instrumentation.ts configured, e.g. OTLP).
 */

import { type AuditActor, type AuditInput, audit, defineAuditAction } from "evlog";
import { isEvlogEnabled } from "@/lib/evlog";

/**
 * Catalog of audit actions. defineAuditAction pre-fills the action name and
 * target type so call sites stay terse and the action set is discoverable in
 * one place. Extend here when auditing new entities (users, billing, …).
 */
export const auditAction = {
  teamCreate: defineAuditAction("team.create", { target: "team" }),
  teamUpdate: defineAuditAction("team.update", { target: "team" }),
  teamDelete: defineAuditAction("team.delete", { target: "team", severity: "high" }),
  teamMemberAdd: defineAuditAction("team.member.add", { target: "team" }),
  teamMemberRemove: defineAuditAction("team.member.remove", { target: "team" }),
  teamMemberRoleUpdate: defineAuditAction("team.member.role_update", { target: "team" }),
};

/** Actor for mutations that cannot be attributed to a signed-in user. */
export const systemActor: AuditActor = { type: "system", id: "shipkit" };

export function userActor(id: string): AuditActor {
  return { type: "user", id };
}

/**
 * Resolve the acting user from the current session, falling back to the
 * system actor. Skips the session lookup entirely while the trial is off.
 */
export async function resolveSessionActor(): Promise<AuditActor> {
  if (!isEvlogEnabled()) return systemActor;
  try {
    const { auth } = await import("@/server/auth");
    const session = await auth();
    return session?.user?.id ? userActor(session.user.id) : systemActor;
  } catch {
    return systemActor;
  }
}

/**
 * Emit an audit event. No-op while the trial flag is off; swallows emit
 * errors so callers never fail because of observability.
 */
export function recordAudit(input: AuditInput): void {
  if (!isEvlogEnabled()) return;
  try {
    audit(input);
  } catch (error) {
    console.warn("[audit-service] failed to record audit event", error);
  }
}

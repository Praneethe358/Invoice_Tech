import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole } from './permissions';

// ─── Audit Logging Utility ────────────────────────────────────
// Fire-and-forget audit logging that never breaks the main operation.

export interface AuditLogParams {
  shopId: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole | 'owner';
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, any> | null;
}

/**
 * Insert an audit log entry using the service-role client (bypasses RLS).
 * This NEVER throws — audit failures are silently logged to console.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      shop_id: params.shopId,
      actor_user_id: params.actorUserId,
      actor_name: params.actorName,
      actor_role: params.actorRole,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      entity_label: params.entityLabel ?? null,
      details: params.details ?? null,
    });
  } catch (err) {
    // Never let audit logging failure break the main operation
    console.error('Audit log failed:', err);
  }
}

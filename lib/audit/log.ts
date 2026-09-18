import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditActorType, AuditEntityType } from "@/types/database";

/**
 * Registra un evento en `public.audit_logs` (Fase B / migrations_v2_b.sql).
 *
 * Siempre usa la SERVICE ROLE key: `audit_logs` no tiene policy de INSERT
 * para el rol `authenticated` a propósito (ver el comentario en
 * migrations_v2_b.sql), así que esta es la única forma de escribir ahí.
 *
 * Deliberadamente NO lanza excepciones: un fallo al auditar (ej. red,
 * columna faltante si la migración no se corrió todavía) nunca debe tumbar
 * el flujo real de negocio (crear un candidato, completar una prueba,
 * generar un reporte). Se limita a loguear el error en la consola del
 * servidor.
 */
export async function logAuditEvent(params: {
  actorId: string | null;
  actorType: AuditActorType;
  action: string;
  entityType: AuditEntityType;
  entityId: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      actor_id: params.actorId,
      actor_type: params.actorType,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      metadata_json: params.metadata ?? {},
    });
    if (error) {
      console.error(`[audit] no se pudo registrar el evento "${params.action}":`, error.message);
    }
  } catch (err) {
    console.error(`[audit] excepción registrando el evento "${params.action}":`, err);
  }
}

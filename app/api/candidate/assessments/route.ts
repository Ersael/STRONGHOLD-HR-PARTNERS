import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeAndPersistScores } from "@/lib/scoring/computeAndPersist";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * GET /api/candidate/assessments
 *
 * Dashboard del candidato autenticado: llama a la RPC `get_my_assessments`
 * (SECURITY DEFINER, filtra por `auth.uid()`). Requiere sesión de Supabase
 * (la protege también `middleware.ts`, pero se revalida aquí por si se
 * llama directo).
 *
 * `just_expired_ids` (auditoría v2 Fase C — bug real corregido): la RPC
 * también expira perezosamente cualquier batería 'in_progress' vencida (el
 * candidato puede dejar correr el tiempo sin volver a abrir la pantalla de
 * examen, solo recargando el dashboard). Antes de este fix, este endpoint
 * ignoraba por completo esos ids: la fila quedaba 'expired' en la base de
 * datos pero jamás se disparaba `computeAndPersistScores`, así que esa
 * batería se quedaba SIN scores para siempre a menos que el candidato
 * volviera a abrir esa evaluación puntual (lo que sí dispara el cálculo en
 * `.../[id]/route.ts`). Ahora se calcula el scoring parcial aquí también,
 * igual que en los demás endpoints que detectan una expiración recién
 * ocurrida, para cumplir la garantía documentada en migrations_v2.sql: "la
 * expiración se resuelve la primera vez que CUALQUIER endpoint toca esa
 * candidate_assessment después de vencido el tiempo".
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_my_assessments");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string; just_expired_ids?: string[] } | null;
  if (!result || result.error) {
    return NextResponse.json(result ?? { error: "unknown" }, { status: 400 });
  }

  const justExpiredIds = result.just_expired_ids ?? [];
  for (const candidateAssessmentId of justExpiredIds) {
    await computeAndPersistScores(candidateAssessmentId);
    await logAuditEvent({
      actorId: user.id,
      actorType: "system",
      action: "assessment_completed_timeout",
      entityType: "candidate_assessment",
      entityId: candidateAssessmentId,
    });
  }

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeAndPersistScores } from "@/lib/scoring/computeAndPersist";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * POST /api/candidate/assessments/[id]/complete
 *
 * El candidato confirma "Finalizar" (todas las preguntas respondidas).
 * Delegado a `complete_my_assessment`; si tiene éxito dispara
 * `computeAndPersistScores` (compartida con el flujo viejo por token, ver
 * lib/scoring/computeAndPersist.ts). Si la RPC detecta que la prueba JUSTO
 * venció en vez de completarse normalmente (`error: 'expired'`), igual
 * disparamos el scoring (parcial) porque el estado ya quedó en 'expired'
 * con lo que sí se alcanzó a responder.
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("complete_my_assessment", {
    p_candidate_assessment_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string; ok?: boolean; already?: boolean } | null;

  if (!result || result.error) {
    if (result?.error === "expired") {
      const scoring = await computeAndPersistScores(id);
      await logAuditEvent({
        actorId: user.id,
        actorType: "system",
        action: "assessment_completed_timeout",
        entityType: "candidate_assessment",
        entityId: id,
      });
      return NextResponse.json({ ...result, ...scoring }, { status: 400 });
    }
    return NextResponse.json(result ?? { error: "unknown" }, { status: 400 });
  }

  if (result.already) {
    return NextResponse.json({ ...result, scoring: "skipped" });
  }

  const scoring = await computeAndPersistScores(id);
  await logAuditEvent({
    actorId: user.id,
    actorType: "candidate",
    action: "assessment_completed",
    entityType: "candidate_assessment",
    entityId: id,
  });
  return NextResponse.json({ ...result, ...scoring });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeAndPersistScores } from "@/lib/scoring/computeAndPersist";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * GET /api/candidate/assessments/[id]
 *
 * Pantalla de examen: llama a `get_assessment_detail`, que ANTES de
 * responder revisa de forma perezosa si la batería estaba 'in_progress' y
 * ya venció (ver nota de diseño en supabase/migrations_v2.sql). Si el RPC
 * indica `just_expired: true` (la prueba se acaba de marcar 'expired' en
 * ESTE mismo request), disparamos aquí el mismo cálculo de scoring parcial
 * que usa una finalización normal, reutilizando
 * `computeAndPersistScores` (compartida con el flujo viejo por token).
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_assessment_detail", {
    p_candidate_assessment_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string; just_expired?: boolean } | null;

  if (!result || result.error) {
    const status = result?.error === "not_found" ? 404 : 400;
    return NextResponse.json(result ?? { error: "unknown" }, { status });
  }

  if (result.just_expired) {
    await computeAndPersistScores(id);
    await logAuditEvent({
      actorId: user.id,
      actorType: "system",
      action: "assessment_completed_timeout",
      entityType: "candidate_assessment",
      entityId: id,
    });
  }

  return NextResponse.json(result);
}

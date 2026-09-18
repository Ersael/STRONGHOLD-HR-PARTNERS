import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * POST /api/candidate/assessments/[id]/start
 *
 * Se llama SOLO cuando el candidato presiona explícitamente el botón
 * "INICIAR" en la pantalla previa de una batería 'pending'. Es el único
 * punto donde arranca el cronómetro real (a diferencia del viejo flujo por
 * token, que auto-iniciaba con solo cargar la página). Delegado a la RPC
 * `start_candidate_assessment` (supabase/migrations_v2.sql).
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

  const { data, error } = await supabase.rpc("start_candidate_assessment", {
    p_candidate_assessment_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string } | null;
  if (!result || result.error) {
    return NextResponse.json(result ?? { error: "unknown" }, { status: 400 });
  }

  await logAuditEvent({
    actorId: user.id,
    actorType: "candidate",
    action: "assessment_started",
    entityType: "candidate_assessment",
    entityId: id,
  });

  return NextResponse.json(result);
}

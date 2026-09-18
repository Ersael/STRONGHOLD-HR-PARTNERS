import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import { computeAndPersistScores } from "@/lib/scoring/computeAndPersist";

const completeSchema = z.object({
  candidate_assessment_id: z.string().uuid(),
});

/**
 * POST /api/assessment/[token]/complete
 *
 * 1) Llama a la función RPC complete_candidate_assessment (anon key), que
 *    valida el token y que todas las preguntas estén respondidas antes de
 *    marcar la batería como 'completed'.
 * 2) Si tiene éxito, dispara `computeAndPersistScores` (lib/scoring), que
 *    usa la SERVICE ROLE key (solo en este servidor, nunca expuesta al
 *    navegador) para leer las preguntas/respuestas completas -incluyendo
 *    `correct_index`, necesario para el scoring de opción múltiple- y
 *    calcular + persistir los scores por dimensión. Este paso es una
 *    operación interna del sistema, no algo que el token del candidato
 *    autorice directamente.
 *
 * Esta misma función de scoring (`computeAndPersistScores`) también la usa
 * el flujo nuevo por sesión de candidato (`app/api/candidate/...`), para no
 * duplicar la lógica entre ambos flujos.
 */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = completeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const anon = createAnonClient();
  const { data: rpcResult, error: rpcError } = await anon.rpc("complete_candidate_assessment", {
    p_token: token,
    p_candidate_assessment_id: parsed.data.candidate_assessment_id,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  const result = rpcResult as { error?: string; ok?: boolean; answered?: number; total?: number };
  if (result?.error) {
    return NextResponse.json({ error: result.error, answered: result.answered, total: result.total }, { status: 400 });
  }

  const scoring = await computeAndPersistScores(parsed.data.candidate_assessment_id);
  return NextResponse.json({ ok: true, ...scoring });
}

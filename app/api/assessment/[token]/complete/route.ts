import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeScoresForAssessment, toScoreRows } from "@/lib/scoring";

const completeSchema = z.object({
  candidate_assessment_id: z.string().uuid(),
});

/**
 * POST /api/assessment/[token]/complete
 *
 * 1) Llama a la función RPC complete_candidate_assessment (anon key), que
 *    valida el token y que todas las preguntas estén respondidas antes de
 *    marcar la batería como 'completed'.
 * 2) Si tiene éxito, usa la SERVICE ROLE key (solo en este servidor, nunca
 *    expuesta al navegador) para leer las preguntas/respuestas completas
 *    -incluyendo `correct_index`, necesario para el scoring de opción
 *    múltiple- y calcular + persistir los scores por dimensión. Este
 *    paso es una operación interna del sistema, no algo que el token del
 *    candidato autorice directamente.
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

  // --- Cálculo de scores (service role, servidor únicamente) ---
  const admin = createAdminClient();

  const { data: candidateAssessment, error: caError } = await admin
    .from("candidate_assessments")
    .select("id, assessment_definition_id, role_variant")
    .eq("id", parsed.data.candidate_assessment_id)
    .single();

  if (caError || !candidateAssessment) {
    // La batería ya quedó marcada como completada aunque el scoring falle;
    // se puede recalcular después. No bloqueamos la respuesta al candidato.
    return NextResponse.json({ ok: true, scoring: "skipped" });
  }

  // role_variant solo aplica a la batería 'role_specific'; para el resto
  // es null y la comparación `.eq` con null no funcionaría, así que
  // construimos el filtro condicionalmente.
  let questionsQuery = admin
    .from("questions")
    .select("*")
    .eq("assessment_definition_id", candidateAssessment.assessment_definition_id)
    .order("order_index");

  questionsQuery = candidateAssessment.role_variant
    ? questionsQuery.eq("role_variant", candidateAssessment.role_variant)
    : questionsQuery.is("role_variant", null);

  const { data: questionsFinal, error: questionsError } = await questionsQuery;

  if (questionsError || !questionsFinal) {
    return NextResponse.json({ ok: true, scoring: "skipped", error: questionsError?.message });
  }

  const { data: responses, error: responsesError } = await admin
    .from("responses")
    .select("*")
    .eq("candidate_assessment_id", parsed.data.candidate_assessment_id);

  if (responsesError) {
    return NextResponse.json({ ok: true, scoring: "skipped" });
  }

  const dimensionResults = computeScoresForAssessment(questionsFinal, responses ?? []);
  const scoreRows = toScoreRows(parsed.data.candidate_assessment_id, dimensionResults);

  if (scoreRows.length > 0) {
    const { error: upsertError } = await admin
      .from("scores")
      .upsert(scoreRows, { onConflict: "candidate_assessment_id,dimension" });

    if (upsertError) {
      return NextResponse.json({ ok: true, scoring: "failed", error: upsertError.message });
    }
  }

  return NextResponse.json({ ok: true, scoring: "done" });
}

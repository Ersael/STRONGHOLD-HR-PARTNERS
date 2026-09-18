import { createAdminClient } from "@/lib/supabase/admin";
import { computeScoresForAssessment, toScoreRows } from "@/lib/scoring";

export type ScoringOutcome =
  | { scoring: "done" }
  | { scoring: "skipped"; error?: string }
  | { scoring: "failed"; error: string };

/**
 * Calcula y persiste los `scores` por dimensión de UNA `candidate_assessment`
 * que ya quedó marcada como `completed` o `expired`, leyendo las preguntas
 * (con `correct_index`, necesario para `multiple_choice`) y las respuestas
 * guardadas con la SERVICE ROLE key (solo código de servidor).
 *
 * Esta función es la lógica que antes vivía duplicada dentro de
 * `app/api/assessment/[token]/complete/route.ts`. Se extrajo aquí para
 * compartirla entre DOS flujos que necesitan disparar exactamente el mismo
 * cálculo:
 *
 *  1) El flujo VIEJO por `unique_token` (sigue intacto, ver
 *     `app/api/assessment/[token]/complete/route.ts`), cuando el candidato
 *     confirma "Finalizar" y `complete_candidate_assessment` marca la
 *     batería como `completed`.
 *  2) El flujo NUEVO por sesión autenticada (`app/api/candidate/...`),
 *     tanto al completar normalmente como al detectar que una batería
 *     `in_progress` ACABA DE expirar por tiempo (`just_expired` /
 *     error `expired` que devuelven las RPC de `migrations_v2.sql`). En
 *     ese caso el scoring es PARCIAL: se calcula sobre las respuestas que
 *     sí se alcanzaron a guardar antes de que se acabara el tiempo,
 *     exactamente igual que si el candidato hubiera completado la prueba,
 *     porque `computeScoresForAssessment` ya es tolerante a preguntas sin
 *     respuesta (no lanza excepción, simplemente no las cuenta).
 *
 * No lanza excepciones: si algo falla, devuelve un resultado descriptivo
 * (`scoring: "skipped" | "failed"`) para que el caller pueda seguir
 * respondiendo al candidato sin bloquearlo (el estado de la
 * candidate_assessment ya quedó persistido correctamente sin importar si el
 * scoring tiene éxito; siempre se puede recalcular después).
 */
export async function computeAndPersistScores(candidateAssessmentId: string): Promise<ScoringOutcome> {
  const admin = createAdminClient();

  const { data: candidateAssessment, error: caError } = await admin
    .from("candidate_assessments")
    .select("id, assessment_definition_id, role_variant")
    .eq("id", candidateAssessmentId)
    .single();

  if (caError || !candidateAssessment) {
    return { scoring: "skipped", error: caError?.message };
  }

  // role_variant solo aplica a la batería 'role_specific'; para el resto es
  // null y la comparación `.eq` con null no funcionaría, así que el filtro
  // se arma condicionalmente.
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
    return { scoring: "skipped", error: questionsError?.message };
  }

  const { data: responses, error: responsesError } = await admin
    .from("responses")
    .select("*")
    .eq("candidate_assessment_id", candidateAssessmentId);

  if (responsesError) {
    return { scoring: "skipped", error: responsesError.message };
  }

  const dimensionResults = computeScoresForAssessment(questionsFinal, responses ?? []);
  const scoreRows = toScoreRows(candidateAssessmentId, dimensionResults);

  if (scoreRows.length > 0) {
    const { error: upsertError } = await admin
      .from("scores")
      .upsert(scoreRows, { onConflict: "candidate_assessment_id,dimension" });

    if (upsertError) {
      return { scoring: "failed", error: upsertError.message };
    }
  }

  return { scoring: "done" };
}

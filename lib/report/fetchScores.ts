import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentConfigJson, Database } from "@/types/database";
import type { DimensionScoreEntry } from "./types";

/**
 * Recolecta los scores de TODAS las baterías COMPLETADAS de un candidato,
 * enriquecidos con la etiqueta humana de cada dimensión (leída desde
 * `assessment_definitions.config_json`, incluyendo el caso especial de
 * `role_specific`, donde las dimensiones dependen del rol asignado).
 *
 * Se hacen consultas separadas (en vez de un embed anidado de supabase-js)
 * para mantener el tipado simple y explícito con los tipos manuales de
 * `types/database.ts`.
 */
export async function fetchDimensionScoresForCandidate(
  supabase: SupabaseClient<Database>,
  candidateId: string,
): Promise<DimensionScoreEntry[]> {
  const { data: candidateAssessments, error: caError } = await supabase
    .from("candidate_assessments")
    .select("id, assessment_definition_id, role_variant, status")
    .eq("candidate_id", candidateId)
    .eq("status", "completed");

  if (caError) throw caError;
  if (!candidateAssessments || candidateAssessments.length === 0) return [];

  const definitionIds = Array.from(
    new Set(candidateAssessments.map((ca) => ca.assessment_definition_id)),
  );

  const { data: definitions, error: defError } = await supabase
    .from("assessment_definitions")
    .select("id, code, config_json")
    .in("id", definitionIds);

  if (defError) throw defError;

  const definitionById = new Map((definitions ?? []).map((d) => [d.id, d]));

  const candidateAssessmentIds = candidateAssessments.map((ca) => ca.id);

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("candidate_assessment_id, dimension, normalized_score, percentile")
    .in("candidate_assessment_id", candidateAssessmentIds);

  if (scoresError) throw scoresError;

  const caById = new Map(candidateAssessments.map((ca) => [ca.id, ca]));

  const results: DimensionScoreEntry[] = [];

  for (const score of scores ?? []) {
    const ca = caById.get(score.candidate_assessment_id);
    if (!ca) continue;
    const definition = definitionById.get(ca.assessment_definition_id);
    if (!definition) continue;

    const config = definition.config_json as AssessmentConfigJson;
    let label = score.dimension;

    if (config.roles) {
      const role = config.roles.find((r) => r.code === ca.role_variant);
      const dim = role?.dimensions.find((d) => d.code === score.dimension);
      if (dim) label = dim.label;
    } else if (config.dimensions) {
      const dim = config.dimensions.find((d) => d.code === score.dimension);
      if (dim) label = dim.label;
    }

    results.push({
      assessment_code: definition.code,
      dimension: score.dimension,
      dimension_label: label,
      normalized_score: Number(score.normalized_score),
      percentile: Number(score.percentile),
    });
  }

  return results;
}

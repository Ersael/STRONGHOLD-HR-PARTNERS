import type { QuestionRow, ResponseRow, ScoreRow } from "@/types/database";
import { scoreLikert5 } from "./likert5";
import { scoreMultipleChoice } from "./multipleChoice";
import { scoreForcedChoiceQuad } from "./forcedChoiceQuad";
import { calculateIllustrativePercentile } from "./percentile";
import type { DimensionScoreResult } from "./types";

export { scoreLikert5, scoreMultipleChoice, scoreForcedChoiceQuad, calculateIllustrativePercentile };
export * from "./types";
export * from "./strengthsRisks";

/**
 * Motor de scoring genérico: dado el conjunto de preguntas de UNA batería
 * (candidate_assessment) y las respuestas dadas, decide qué función de
 * scoring usar según el `question_type` predominante y devuelve el
 * percentil ilustrativo ya calculado, listo para insertar en `scores`.
 *
 * Una batería siempre tiene un único question_type dominante en esta
 * fase (ver assessment_definitions.config_json.question_type), pero la
 * función es defensiva: agrupa por tipo real de cada pregunta por si en
 * el futuro (fase 2) una batería combina tipos.
 */
export function computeScoresForAssessment(
  questions: QuestionRow[],
  responses: ResponseRow[],
): DimensionScoreResult[] {
  const likert5Questions = questions.filter((q) => q.question_type === "likert5");
  const multipleChoiceQuestions = questions.filter((q) => q.question_type === "multiple_choice");
  const forcedChoiceQuestions = questions.filter((q) => q.question_type === "forced_choice_quad");

  return [
    ...scoreLikert5(likert5Questions, responses),
    ...scoreMultipleChoice(multipleChoiceQuestions, responses),
    ...scoreForcedChoiceQuad(forcedChoiceQuestions, responses),
  ];
}

/**
 * Convierte resultados de dimensión en filas listas para `scores`,
 * agregando el percentil ilustrativo.
 */
export function toScoreRows(
  candidateAssessmentId: string,
  dimensionResults: DimensionScoreResult[],
): Array<Pick<ScoreRow, "candidate_assessment_id" | "dimension" | "raw_score" | "normalized_score" | "percentile">> {
  return dimensionResults.map((r) => ({
    candidate_assessment_id: candidateAssessmentId,
    dimension: r.dimension,
    raw_score: r.raw_score,
    normalized_score: r.normalized_score,
    percentile: calculateIllustrativePercentile(r.normalized_score),
  }));
}

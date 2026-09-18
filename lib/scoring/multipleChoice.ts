import type { AnswerJson, QuestionRow, ResponseRow } from "@/types/database";
import { getMultipleChoiceOptions, isMultipleChoiceAnswer, type DimensionScoreResult } from "./types";

/**
 * Scoring para preguntas de opción múltiple (ej. razonamiento cognitivo).
 *
 * Por cada dimensión (categoría, ej. "verbal", "numerico", "abstracto") se
 * calcula el % de aciertos respecto a `options_json.correct_index`.
 * El raw_score y el normalized_score son el mismo valor (0-100) porque un
 * porcentaje de aciertos ya está naturalmente en esa escala.
 */
export function scoreMultipleChoice(
  questions: QuestionRow[],
  responses: ResponseRow[],
): DimensionScoreResult[] {
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const statsByDimension = new Map<string, { correct: number; total: number }>();

  for (const question of questions) {
    if (question.question_type !== "multiple_choice") continue;
    const bucket = statsByDimension.get(question.dimension) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    statsByDimension.set(question.dimension, bucket);
  }

  for (const response of responses) {
    const question = questionById.get(response.question_id);
    if (!question || question.question_type !== "multiple_choice") continue;

    const answer = response.answer_json as AnswerJson;
    if (!isMultipleChoiceAnswer(answer)) continue;

    const options = getMultipleChoiceOptions(question.options_json);
    if (typeof options.correct_index !== "number") continue;

    if (answer.selected_index === options.correct_index) {
      const bucket = statsByDimension.get(question.dimension);
      if (bucket) bucket.correct += 1;
    }
  }

  const results: DimensionScoreResult[] = [];
  for (const [dimension, { correct, total }] of statsByDimension.entries()) {
    if (total === 0) continue;
    const percentage = (correct / total) * 100;
    results.push({
      dimension,
      raw_score: Number(percentage.toFixed(2)),
      normalized_score: Number(percentage.toFixed(2)),
    });
  }

  return results;
}

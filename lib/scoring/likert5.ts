import type { AnswerJson, QuestionRow, ResponseRow } from "@/types/database";
import { isLikert5Answer, type DimensionScoreResult } from "./types";

/**
 * Scoring para preguntas tipo Likert (1-5).
 *
 * Para cada respuesta se toma el valor 1-5. Si la pregunta está marcada
 * `is_reverse_scored`, se invierte con (6 - valor). Se promedia por
 * dimensión y se normaliza a una escala 0-100: (promedio - 1) / 4 * 100.
 */
export function scoreLikert5(
  questions: QuestionRow[],
  responses: ResponseRow[],
): DimensionScoreResult[] {
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const sumByDimension = new Map<string, { sum: number; count: number }>();

  for (const response of responses) {
    const question = questionById.get(response.question_id);
    if (!question || question.question_type !== "likert5") continue;

    const answer = response.answer_json as AnswerJson;
    if (!isLikert5Answer(answer)) continue;

    const rawValue = question.is_reverse_scored ? 6 - answer.value : answer.value;

    const bucket = sumByDimension.get(question.dimension) ?? { sum: 0, count: 0 };
    bucket.sum += rawValue;
    bucket.count += 1;
    sumByDimension.set(question.dimension, bucket);
  }

  const results: DimensionScoreResult[] = [];
  for (const [dimension, { sum, count }] of sumByDimension.entries()) {
    if (count === 0) continue;
    const average = sum / count;
    const normalized = ((average - 1) / 4) * 100;
    results.push({
      dimension,
      raw_score: Number(average.toFixed(2)),
      normalized_score: Number(normalized.toFixed(2)),
    });
  }

  return results;
}

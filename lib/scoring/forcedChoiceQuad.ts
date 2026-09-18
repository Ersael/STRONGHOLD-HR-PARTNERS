import type { AnswerJson, ForcedChoiceQuadAnswer, QuestionRow, ResponseRow } from "@/types/database";
import { getForcedChoiceQuadOptions, type DimensionScoreResult } from "./types";

function isForcedChoiceQuadAnswer(answer: AnswerJson): answer is ForcedChoiceQuadAnswer {
  const a = answer as ForcedChoiceQuadAnswer;
  return typeof a?.most_index === "number" && typeof a?.least_index === "number";
}

/**
 * Scoring estilo Cleaver/DISC para preguntas `forced_choice_quad`.
 *
 * Cada bloque (pregunta) presenta 4 frases, cada una asociada a una
 * dimensión (D/I/S/C). El candidato marca una frase como "MÁS como yo"
 * (+1 a esa dimensión) y otra como "MENOS como yo" (-1 a esa dimensión).
 * Se acumula el resultado a través de todos los bloques respondidos
 * (en producción real, 28 bloques; en esta fase 1 hay 3 de ejemplo).
 *
 * Normalización: por cada dimensión se cuenta en cuántos bloques apareció
 * como opción (`maxCount`, el techo teórico si siempre se hubiera elegido
 * como "más" sería +maxCount, si siempre como "menos" sería -maxCount).
 * normalized = ((suma + maxCount) / (2 * maxCount)) * 100, quedando en
 * [0, 100] con 50 como punto neutro.
 */
export function scoreForcedChoiceQuad(
  questions: QuestionRow[],
  responses: ResponseRow[],
): DimensionScoreResult[] {
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const sumByDimension = new Map<string, number>();
  const appearancesByDimension = new Map<string, number>();

  for (const question of questions) {
    if (question.question_type !== "forced_choice_quad") continue;
    const options = getForcedChoiceQuadOptions(question.options_json);
    for (const option of options.options) {
      appearancesByDimension.set(
        option.dimension,
        (appearancesByDimension.get(option.dimension) ?? 0) + 1,
      );
    }
  }

  for (const response of responses) {
    const question = questionById.get(response.question_id);
    if (!question || question.question_type !== "forced_choice_quad") continue;

    const answer = response.answer_json as AnswerJson;
    if (!isForcedChoiceQuadAnswer(answer)) continue;

    const options = getForcedChoiceQuadOptions(question.options_json);
    const mostOption = options.options[answer.most_index];
    const leastOption = options.options[answer.least_index];

    if (mostOption) {
      sumByDimension.set(mostOption.dimension, (sumByDimension.get(mostOption.dimension) ?? 0) + 1);
    }
    if (leastOption) {
      sumByDimension.set(
        leastOption.dimension,
        (sumByDimension.get(leastOption.dimension) ?? 0) - 1,
      );
    }
  }

  const results: DimensionScoreResult[] = [];
  for (const [dimension, maxCount] of appearancesByDimension.entries()) {
    if (maxCount === 0) continue;
    const sum = sumByDimension.get(dimension) ?? 0;
    const normalized = ((sum + maxCount) / (2 * maxCount)) * 100;
    results.push({
      dimension,
      raw_score: sum,
      normalized_score: Number(normalized.toFixed(2)),
    });
  }

  return results;
}

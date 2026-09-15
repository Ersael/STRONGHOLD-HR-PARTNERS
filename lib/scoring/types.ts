import type {
  AnswerJson,
  ForcedChoiceQuadOptions,
  Likert5Answer,
  MultipleChoiceAnswer,
  MultipleChoiceOptions,
  QuestionRow,
  ResponseRow,
} from "@/types/database";

/** Input genérico que reciben todas las funciones de scoring por tipo. */
export interface ScoringInput {
  questions: QuestionRow[];
  responses: ResponseRow[];
}

/** Resultado de scoring por dimensión, previo a persistir en `scores`. */
export interface DimensionScoreResult {
  dimension: string;
  raw_score: number;
  normalized_score: number;
}

export function isLikert5Answer(answer: AnswerJson): answer is Likert5Answer {
  return typeof (answer as Likert5Answer)?.value === "number";
}

export function isMultipleChoiceAnswer(answer: AnswerJson): answer is MultipleChoiceAnswer {
  return typeof (answer as MultipleChoiceAnswer)?.selected_index === "number";
}

export function getMultipleChoiceOptions(options: unknown): MultipleChoiceOptions {
  return options as MultipleChoiceOptions;
}

export function getForcedChoiceQuadOptions(options: unknown): ForcedChoiceQuadOptions {
  return options as ForcedChoiceQuadOptions;
}

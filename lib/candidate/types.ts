import type {
  AnswerJson,
  AssessmentCode,
  AssessmentStatus,
  QuestionOptionsJson,
  QuestionType,
  RoleVariantCode,
} from "@/types/database";

/**
 * Formas devueltas por las RPC de sesión de candidato (`get_my_assessments`,
 * `get_assessment_detail`, `start_candidate_assessment`,
 * `save_my_response`, `complete_my_assessment`) definidas en
 * `supabase/migrations_v2.sql`. Análogo a `lib/assessment/types.ts` (flujo
 * viejo por token), pero para el flujo nuevo por sesión autenticada.
 */

export interface CandidateSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position_applied: string | null;
}

/** Una fila de `get_my_assessments` (dashboard, sin preguntas/respuestas). */
export interface MyAssessmentSummary {
  id: string;
  assessment_definition_id: string;
  assessment_code: AssessmentCode;
  assessment_name: string;
  assessment_description: string;
  role_variant: RoleVariantCode | null;
  status: AssessmentStatus;
  time_limit_minutes: number;
  started_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  completed_by_timeout: boolean;
  current_question_index: number;
  total_questions: number;
  answered_questions: number;
}

export interface MyAssessmentsResponse {
  ok: true;
  server_time: string;
  candidate: CandidateSummary;
  assessments: MyAssessmentSummary[];
  /**
   * Ids de candidate_assessments que la propia llamada a get_my_assessments
   * acaba de expirar por tiempo (ver migrations_v2.sql). El route handler
   * (app/api/candidate/assessments/route.ts) ya consume esto para disparar
   * el scoring parcial antes de responder; se deja tipado aquí por si algún
   * consumidor del lado del cliente necesita saber que una tarjeta que
   * mostraba "en progreso" acaba de pasar a "expirada" en esta misma carga.
   */
  just_expired_ids?: string[];
}

/** Pregunta tal como la devuelve get_assessment_detail (sin correct_index). */
export interface CandidateQuestion {
  id: string;
  order_index: number;
  question_type: QuestionType;
  dimension: string;
  prompt_text: string;
  options_json: QuestionOptionsJson;
  is_reverse_scored: boolean;
}

export interface CandidateSavedResponse {
  question_id: string;
  answer_json: AnswerJson;
}

export interface AssessmentDetail {
  id: string;
  assessment_definition_id: string;
  assessment_code: AssessmentCode;
  assessment_name: string;
  assessment_description: string;
  role_variant: RoleVariantCode | null;
  status: AssessmentStatus;
  time_limit_minutes: number;
  started_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  completed_by_timeout: boolean;
  current_question_index: number;
  questions: CandidateQuestion[];
  responses: CandidateSavedResponse[];
}

export interface AssessmentDetailResponse {
  ok: true;
  server_time: string;
  just_expired: boolean;
  assessment: AssessmentDetail;
}

export interface ApiErrorResponse {
  error: string;
  [key: string]: unknown;
}

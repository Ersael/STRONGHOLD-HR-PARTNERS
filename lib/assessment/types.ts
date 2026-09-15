import type {
  AnswerJson,
  AssessmentCode,
  AssessmentConfigJson,
  AssessmentStatus,
  QuestionOptionsJson,
  QuestionType,
  RoleVariantCode,
} from "@/types/database";

/** Forma devuelta por la RPC get_assessment_by_token (ver supabase/schema.sql). */
export interface PortalQuestion {
  id: string;
  order_index: number;
  question_type: QuestionType;
  dimension: string;
  prompt_text: string;
  options_json: QuestionOptionsJson;
  is_reverse_scored: boolean;
}

export interface PortalResponse {
  question_id: string;
  answer_json: AnswerJson;
}

export interface PortalAssessment {
  id: string;
  assessment_definition_id: string;
  assessment_code: AssessmentCode;
  assessment_name: string;
  config_json: AssessmentConfigJson;
  role_variant: RoleVariantCode | null;
  status: AssessmentStatus;
  expires_at: string;
  started_at: string | null;
  completed_at: string | null;
  questions: PortalQuestion[];
  responses: PortalResponse[];
}

export interface PortalCandidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position_applied: string | null;
}

export interface PortalData {
  candidate: PortalCandidate;
  assessments: PortalAssessment[];
}

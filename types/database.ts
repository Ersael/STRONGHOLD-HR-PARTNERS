/**
 * Tipos manuales de la base de datos Supabase.
 *
 * En un entorno con credenciales reales se recomienda regenerar esto con
 * `supabase gen types typescript --project-id <id> > types/database.ts`.
 * Como esta fase 1 se construye sin acceso a un proyecto Supabase real,
 * estos tipos se mantienen a mano en sincronía con `supabase/schema.sql`.
 */

export type AssessmentCode =
  | "behavioral"
  | "cognitive"
  | "personality"
  | "competencies"
  | "values"
  | "leadership"
  | "role_specific";

export type RoleVariantCode =
  | "sales"
  | "commercial_manager"
  | "director"
  | "consultant"
  | "analyst"
  | "operations"
  | "hr";

export type QuestionType = "forced_choice_quad" | "likert5" | "multiple_choice";

// "expired" y "revoked" se agregan en supabase/migrations_v2.sql (Fase A).
// "expired": la batería estaba 'in_progress' y se venció el tiempo (lazy,
// ver nota de diseño en migrations_v2.sql). "revoked": reservado para la
// Fase B (admin invalida manualmente una prueba asignada); no hay código
// todavía que lo asigne, pero el tipo ya lo contempla.
export type AssessmentStatus = "pending" | "in_progress" | "completed" | "expired" | "revoked";

// ---------------------------------------------------------------------------
// options_json shapes por tipo de pregunta
// ---------------------------------------------------------------------------
export interface Likert5Options {
  scale_labels?: [string, string, string, string, string];
}

export interface MultipleChoiceOptions {
  choices: string[];
  /** Solo presente en la tabla `questions`. Nunca se envía al candidato. */
  correct_index?: number;
}

export interface ForcedChoiceQuadOption {
  text: string;
  dimension: string;
}

export interface ForcedChoiceQuadOptions {
  options: [
    ForcedChoiceQuadOption,
    ForcedChoiceQuadOption,
    ForcedChoiceQuadOption,
    ForcedChoiceQuadOption,
  ];
}

export type QuestionOptionsJson =
  | Likert5Options
  | MultipleChoiceOptions
  | ForcedChoiceQuadOptions
  | Record<string, unknown>;

// ---------------------------------------------------------------------------
// answer_json shapes por tipo de pregunta
// ---------------------------------------------------------------------------
export interface Likert5Answer {
  value: 1 | 2 | 3 | 4 | 5;
}

export interface MultipleChoiceAnswer {
  selected_index: number;
}

export interface ForcedChoiceQuadAnswer {
  most_index: 0 | 1 | 2 | 3;
  least_index: 0 | 1 | 2 | 3;
}

export type AnswerJson = Likert5Answer | MultipleChoiceAnswer | ForcedChoiceQuadAnswer;

// ---------------------------------------------------------------------------
// config_json de assessment_definitions
// ---------------------------------------------------------------------------
export interface DimensionConfig {
  code: string;
  label: string;
}

export interface RoleSpecificRoleConfig {
  code: RoleVariantCode;
  label: string;
  dimensions: DimensionConfig[];
}

export interface AssessmentConfigJson {
  question_type: QuestionType;
  dimensions?: DimensionConfig[];
  /** Solo presente cuando code === 'role_specific' */
  roles?: RoleSpecificRoleConfig[];
}

// ---------------------------------------------------------------------------
// Filas de tablas
// ---------------------------------------------------------------------------
// NOTA: estas filas se declaran con `type` (no `interface`) a propósito.
// El cliente genérico de supabase-js/postgrest-js exige que cada `Row` sea
// estructuralmente asignable a `Record<string, unknown>`; los tipos
// declarados con `interface` no obtienen un índice de firma implícito y
// fallan esa comprobación (colapsando todo a `never`), mientras que los
// alias de tipo (`type`) sí lo permiten.
export type AdminRow = {
  id: string;
  name: string;
  email: string;
  organization_name: string;
  created_at: string;
};

export type CandidateRow = {
  id: string;
  admin_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position_applied: string | null;
  notes: string | null;
  created_at: string;
};

export type AssessmentDefinitionRow = {
  id: string;
  code: AssessmentCode;
  name: string;
  description: string;
  config_json: AssessmentConfigJson;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  assessment_definition_id: string;
  role_variant: RoleVariantCode | null;
  order_index: number;
  question_type: QuestionType;
  dimension: string;
  prompt_text: string;
  options_json: QuestionOptionsJson;
  is_reverse_scored: boolean;
  created_at: string;
};

export type CandidateAssessmentRow = {
  id: string;
  candidate_id: string;
  assessment_definition_id: string;
  role_variant: RoleVariantCode | null;
  unique_token: string;
  status: AssessmentStatus;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
  /** Minutos de tiempo real de examen (Fase A / migrations_v2.sql). Default 30. */
  time_limit_minutes: number;
  /** Índice de la última pregunta vista, para reanudar exacto. */
  current_question_index: number;
  /** true si la batería pasó a 'expired' por vencimiento del tiempo. */
  completed_by_timeout: boolean;
};

export type ResponseRow = {
  id: string;
  candidate_assessment_id: string;
  question_id: string;
  answer_json: AnswerJson;
  answered_at: string;
};

export type ScoreRow = {
  id: string;
  candidate_assessment_id: string;
  dimension: string;
  raw_score: number;
  normalized_score: number;
  percentile: number;
  created_at: string;
};

export type ReportRow = {
  id: string;
  candidate_id: string;
  generated_at: string;
  report_json: ReportJson;
  pdf_url: string | null;
};

// ---------------------------------------------------------------------------
// audit_logs (Fase B / migrations_v2_b.sql)
// ---------------------------------------------------------------------------
export type AuditActorType = "admin" | "candidate" | "system";
export type AuditEntityType = "candidate" | "candidate_assessment" | "report" | "system";

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_type: AuditActorType;
  action: string;
  entity_type: AuditEntityType;
  entity_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Estructura del reporte de 12 secciones (ver lib/report/generate.ts)
// ---------------------------------------------------------------------------
export interface ReportSection {
  id: number;
  title: string;
  content: string;
}

export interface ReportJson {
  candidate: {
    id: string;
    full_name: string;
    email: string;
    position_applied: string | null;
  };
  generated_at: string;
  dimension_scores: Array<{
    assessment_code: AssessmentCode;
    dimension: string;
    dimension_label: string;
    normalized_score: number;
    percentile: number;
    level: "alto" | "medio" | "bajo";
  }>;
  strengths: string[];
  risks: string[];
  sections: ReportSection[];
  ethical_notice: string;
  /**
   * true si, al momento de generar el reporte, el candidato tenía al menos
   * una batería asignada que NO estaba `completed` (Fase B). Cuando es
   * `true`, tanto la vista admin como el PDF deben mostrar un banner
   * explícito y las secciones que dependen por completo de una batería
   * pendiente deben decirlo en vez de inventar contenido (ver
   * lib/report/sections.ts).
   */
  partial: boolean;
  /** Códigos de batería (`assessment_definitions.code`) con al menos una
   * candidate_assessment en estado 'completed' para este candidato. */
  completed_assessments: AssessmentCode[];
  /** Códigos de batería asignados al candidato pero sin ninguna fila
   * 'completed' (pending, in_progress, expired o revoked). */
  pending_assessments: AssessmentCode[];
}

// ---------------------------------------------------------------------------
// Definición del esquema completo para el cliente tipado de supabase-js
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      admins: {
        Row: AdminRow;
        Insert: Partial<AdminRow> & Pick<AdminRow, "id" | "name" | "email">;
        Update: Partial<AdminRow>;
        Relationships: [];
      };
      candidates: {
        Row: CandidateRow;
        // Desde migrations_v2.sql, `id` ya NO tiene default en la base de
        // datos: debe ser el uuid de un auth.users ya creado (vía Admin API,
        // ver scripts/seed-test-candidate.ts), por eso es obligatorio aquí.
        Insert: Partial<CandidateRow> &
          Pick<CandidateRow, "id" | "admin_id" | "full_name" | "email">;
        Update: Partial<CandidateRow>;
        Relationships: [];
      };
      assessment_definitions: {
        Row: AssessmentDefinitionRow;
        Insert: Partial<AssessmentDefinitionRow> &
          Pick<AssessmentDefinitionRow, "code" | "name" | "description">;
        Update: Partial<AssessmentDefinitionRow>;
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: Partial<QuestionRow> &
          Pick<
            QuestionRow,
            "assessment_definition_id" | "question_type" | "dimension" | "prompt_text"
          >;
        Update: Partial<QuestionRow>;
        Relationships: [];
      };
      candidate_assessments: {
        Row: CandidateAssessmentRow;
        Insert: Partial<CandidateAssessmentRow> &
          Pick<
            CandidateAssessmentRow,
            "candidate_id" | "assessment_definition_id" | "unique_token"
          >;
        Update: Partial<CandidateAssessmentRow>;
        Relationships: [];
      };
      responses: {
        Row: ResponseRow;
        Insert: Partial<ResponseRow> &
          Pick<ResponseRow, "candidate_assessment_id" | "question_id" | "answer_json">;
        Update: Partial<ResponseRow>;
        Relationships: [];
      };
      scores: {
        Row: ScoreRow;
        Insert: Partial<ScoreRow> &
          Pick<
            ScoreRow,
            "candidate_assessment_id" | "dimension" | "raw_score" | "normalized_score" | "percentile"
          >;
        Update: Partial<ScoreRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Partial<ReportRow> & Pick<ReportRow, "candidate_id" | "report_json">;
        Update: Partial<ReportRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Partial<AuditLogRow> & Pick<AuditLogRow, "actor_type" | "action" | "entity_type">;
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_assessment_by_token: {
        Args: { p_token: string };
        Returns: unknown;
      };
      save_response: {
        Args: {
          p_token: string;
          p_candidate_assessment_id: string;
          p_question_id: string;
          p_answer: AnswerJson;
        };
        Returns: unknown;
      };
      update_candidate_personal_info: {
        Args: { p_token: string; p_full_name: string; p_phone: string };
        Returns: unknown;
      };
      complete_candidate_assessment: {
        Args: { p_token: string; p_candidate_assessment_id: string };
        Returns: unknown;
      };
      // ---------------------------------------------------------------------
      // RPCs Fase A (migrations_v2.sql) — flujo de candidato autenticado por
      // sesión (auth.uid()), en vez de unique_token.
      // ---------------------------------------------------------------------
      get_my_assessments: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      start_candidate_assessment: {
        Args: { p_candidate_assessment_id: string };
        Returns: unknown;
      };
      get_assessment_detail: {
        Args: { p_candidate_assessment_id: string };
        Returns: unknown;
      };
      save_my_response: {
        Args: {
          p_candidate_assessment_id: string;
          p_question_id: string;
          p_answer: AnswerJson;
          p_current_question_index?: number | null;
        };
        Returns: unknown;
      };
      complete_my_assessment: {
        Args: { p_candidate_assessment_id: string };
        Returns: unknown;
      };
    };
  };
}

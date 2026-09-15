import type { AssessmentCode } from "@/types/database";

export type ScoreLevel = "alto" | "medio" | "bajo";

/** Una entrada de score por dimensión, ya enriquecida con etiqueta humana. */
export interface DimensionScoreEntry {
  assessment_code: AssessmentCode;
  dimension: string;
  dimension_label: string;
  normalized_score: number;
  percentile: number;
}

export interface CandidateBasicInfo {
  id: string;
  full_name: string;
  email: string;
  position_applied: string | null;
}

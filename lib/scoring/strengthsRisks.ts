import { SCORE_THRESHOLDS } from "@/lib/constants";

export interface DimensionScoreWithLabel {
  dimension: string;
  dimensionLabel: string;
  normalized_score: number;
}

export interface StrengthsAndRisks {
  strengths: DimensionScoreWithLabel[];
  risks: DimensionScoreWithLabel[];
}

/**
 * Combina los scores de TODAS las baterías completadas de un candidato en
 * indicadores de "fortalezas" (normalized_score > 70) y "riesgos"
 * (normalized_score < 30), usando reglas simples si-entonces. No requiere
 * IA externa; es puro cálculo determinístico sobre los scores ya
 * calculados por el motor de scoring.
 */
export function computeStrengthsAndRisks(
  scores: DimensionScoreWithLabel[],
): StrengthsAndRisks {
  const strengths = scores
    .filter((s) => s.normalized_score > SCORE_THRESHOLDS.high)
    .sort((a, b) => b.normalized_score - a.normalized_score);

  const risks = scores
    .filter((s) => s.normalized_score < 30)
    .sort((a, b) => a.normalized_score - b.normalized_score);

  return { strengths, risks };
}

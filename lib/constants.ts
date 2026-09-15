import type { AssessmentCode, RoleVariantCode } from "@/types/database";

/**
 * Aviso ético que debe mostrarse SIEMPRE de forma visible: banner discreto
 * en el dashboard admin y pie del reporte PDF. No omitir.
 */
export const ETHICAL_NOTICE =
  "Los resultados de esta plataforma son orientativos y no sustituyen una " +
  "validación psicométrica certificada. No deben ser el único criterio de " +
  "decisión de contratación.";

export const ASSESSMENT_DEFINITIONS_META: Array<{
  code: AssessmentCode;
  name: string;
  shortLabel: string;
}> = [
  { code: "behavioral", name: "Comportamiento (estilo DISC)", shortLabel: "Comportamiento" },
  { code: "cognitive", name: "Razonamiento Cognitivo", shortLabel: "Cognitivo" },
  { code: "personality", name: "Inventario de Personalidad", shortLabel: "Personalidad" },
  { code: "competencies", name: "Competencias Generales", shortLabel: "Competencias" },
  { code: "values", name: "Inventario de Valores", shortLabel: "Valores" },
  { code: "leadership", name: "Potencial de Liderazgo", shortLabel: "Liderazgo" },
  { code: "role_specific", name: "Competencias Específicas del Rol", shortLabel: "Rol Específico" },
];

export const ROLE_VARIANTS: Array<{ code: RoleVariantCode; label: string }> = [
  { code: "sales", label: "Ventas" },
  { code: "commercial_manager", label: "Gerente Comercial" },
  { code: "director", label: "Director" },
  { code: "consultant", label: "Consultor" },
  { code: "analyst", label: "Analista" },
  { code: "operations", label: "Operaciones" },
  { code: "hr", label: "RRHH" },
];

/** Umbrales para clasificar un normalized_score (0-100) en alto/medio/bajo. */
export const SCORE_THRESHOLDS = {
  high: 70,
  low: 40,
};

export function classifyScore(normalizedScore: number): "alto" | "medio" | "bajo" {
  if (normalizedScore >= SCORE_THRESHOLDS.high) return "alto";
  if (normalizedScore < SCORE_THRESHOLDS.low) return "bajo";
  return "medio";
}

/**
 * Norma placeholder ILUSTRATIVA (no es una norma poblacional real) usada
 * únicamente para calcular un percentil de referencia. Ver
 * lib/scoring/percentile.ts.
 */
export const PLACEHOLDER_NORM = {
  mean: 50,
  stdDev: 15,
};

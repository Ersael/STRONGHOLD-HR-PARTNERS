import { classifyScore, ETHICAL_NOTICE } from "@/lib/constants";
import { computeStrengthsAndRisks } from "@/lib/scoring";
import type { ReportJson } from "@/types/database";
import type { CandidateBasicInfo, DimensionScoreEntry } from "./types";
import {
  sectionAreasDesarrollo,
  sectionBajoPresion,
  sectionCompetencias,
  sectionEtica,
  sectionFortalezas,
  sectionLiderazgo,
  sectionPerfilIntegrado,
  sectionPotencial,
  sectionPreguntasEntrevista,
  sectionRecomendacionContratacion,
  sectionRiesgos,
  sectionRolesRecomendados,
} from "./sections";

/**
 * Genera el reporte estructurado de 12 secciones a partir de los scores ya
 * calculados de un candidato. No llama a ninguna API externa de IA: todo
 * el contenido se genera con reglas deterministas (if/else por nivel de
 * score) en lib/report/sections.ts.
 */
export function generateReport(
  candidate: CandidateBasicInfo,
  dimensionScores: DimensionScoreEntry[],
): ReportJson {
  const { strengths, risks } = computeStrengthsAndRisks(
    dimensionScores.map((s) => ({
      dimension: s.dimension,
      dimensionLabel: s.dimension_label,
      normalized_score: s.normalized_score,
    })),
  );

  // Reconstruimos las entradas completas de fortalezas/riesgos (con
  // assessment_code y percentile) para pasarlas a las secciones que las
  // necesitan con el tipo completo.
  const strengthEntries = dimensionScores.filter((s) =>
    strengths.some((x) => x.dimension === s.dimension),
  );
  const riskEntries = dimensionScores.filter((s) => risks.some((x) => x.dimension === s.dimension));

  const sections = [
    { id: 1, title: "Perfil Integrado", content: sectionPerfilIntegrado(dimensionScores) },
    { id: 2, title: "Fortalezas", content: sectionFortalezas(strengthEntries) },
    { id: 3, title: "Riesgos", content: sectionRiesgos(riskEntries) },
    { id: 4, title: "Potencial", content: sectionPotencial(dimensionScores) },
    { id: 5, title: "Análisis Bajo Presión", content: sectionBajoPresion(dimensionScores) },
    { id: 6, title: "Análisis de Liderazgo", content: sectionLiderazgo(dimensionScores) },
    { id: 7, title: "Análisis de Ética", content: sectionEtica(dimensionScores) },
    { id: 8, title: "Análisis de Competencias", content: sectionCompetencias(dimensionScores) },
    { id: 9, title: "Roles Recomendados", content: sectionRolesRecomendados(dimensionScores) },
    {
      id: 10,
      title: "Áreas de Desarrollo",
      content: sectionAreasDesarrollo(riskEntries, dimensionScores),
    },
    {
      id: 11,
      title: "Recomendación de Contratación",
      content: sectionRecomendacionContratacion(dimensionScores, riskEntries.length),
    },
    {
      id: 12,
      title: "Preguntas Sugeridas para Entrevista",
      content: sectionPreguntasEntrevista(riskEntries, strengthEntries),
    },
  ];

  const report: ReportJson = {
    candidate: {
      id: candidate.id,
      full_name: candidate.full_name,
      email: candidate.email,
      position_applied: candidate.position_applied,
    },
    generated_at: new Date().toISOString(),
    dimension_scores: dimensionScores.map((s) => ({
      assessment_code: s.assessment_code,
      dimension: s.dimension,
      dimension_label: s.dimension_label,
      normalized_score: s.normalized_score,
      percentile: s.percentile,
      level: classifyScore(s.normalized_score),
    })),
    strengths: strengthEntries.map((s) => s.dimension_label),
    risks: riskEntries.map((s) => s.dimension_label),
    sections,
    ethical_notice: ETHICAL_NOTICE,
  };

  return report;
}

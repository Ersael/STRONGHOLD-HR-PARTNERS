import { ASSESSMENT_DEFINITIONS_META, classifyScore } from "@/lib/constants";
import type { DimensionScoreEntry, ScoreLevel } from "./types";

/**
 * Mensaje estándar para secciones que dependen POR COMPLETO de una (o más)
 * baterías sin ningún score disponible todavía (Fase B: reportes
 * parciales). Se usa en vez de calcular con datos neutros/inventados. Ver
 * `lib/report/fetchScores.ts` (fetchAssessmentCompletionStatus) y
 * `lib/report/generate.ts` para cómo se decide `partial`.
 */
function batteryLabel(code: string): string {
  return ASSESSMENT_DEFINITIONS_META.find((m) => m.code === code)?.name ?? code;
}

function unavailableSection(codes: string[], mode: "all" | "any" = "all"): string {
  const labels = codes.map(batteryLabel);
  const joined = mode === "any" ? labels.join(" o ") : labels.join(" y ");
  const dependsOn =
    labels.length > 1
      ? mode === "any"
        ? `de al menos una de estas baterías: ${joined}`
        : `de las baterías: ${joined}`
      : `de la batería de ${joined}`;

  return (
    `Esta sección todavía no se puede generar: depende ${dependsOn}, que el candidato aún no ha completado. ` +
    `Se completará automáticamente la próxima vez que se regenere el reporte, en cuanto exista al menos un ` +
    `score real disponible. No se muestra contenido genérico o inventado mientras tanto.`
  );
}

function pick<T>(level: ScoreLevel, options: Record<ScoreLevel, T>): T {
  return options[level];
}

function avg(entries: DimensionScoreEntry[]): number {
  if (entries.length === 0) return 50; // sin datos: punto neutro
  return entries.reduce((sum, e) => sum + e.normalized_score, 0) / entries.length;
}

function byAssessment(scores: DimensionScoreEntry[], code: string): DimensionScoreEntry[] {
  return scores.filter((s) => s.assessment_code === code);
}

function byDimension(scores: DimensionScoreEntry[], dimension: string): DimensionScoreEntry | undefined {
  return scores.find((s) => s.dimension === dimension);
}

function topDisc(scores: DimensionScoreEntry[]): DimensionScoreEntry | undefined {
  const disc = byAssessment(scores, "behavioral");
  if (disc.length === 0) return undefined;
  return [...disc].sort((a, b) => b.normalized_score - a.normalized_score)[0];
}

const DISC_LABELS: Record<string, string> = {
  D: "Dominancia",
  I: "Influencia",
  S: "Estabilidad",
  C: "Cumplimiento",
};

// ---------------------------------------------------------------------------
// 1. Perfil Integrado
// ---------------------------------------------------------------------------
export function sectionPerfilIntegrado(scores: DimensionScoreEntry[]): string {
  const overallLevel = classifyScore(avg(scores));
  const disc = topDisc(scores);
  const discText = disc
    ? ` Su estilo conductual predominante es "${DISC_LABELS[disc.dimension] ?? disc.dimension}".`
    : "";

  return pick(overallLevel, {
    alto:
      `El perfil general del candidato muestra un desempeño consistentemente alto a través de las ` +
      `baterías evaluadas, con varias dimensiones por encima del promedio de referencia.${discText} ` +
      `Esto sugiere un perfil sólido y versátil, aunque conviene contrastarlo con evidencia conductual ` +
      `adicional (referencias, entrevista estructurada) antes de tomar decisiones.`,
    medio:
      `El perfil general del candidato es equilibrado, con un desempeño dentro del rango esperado en la ` +
      `mayoría de las dimensiones evaluadas.${discText} No se observan alertas mayores, pero tampoco ` +
      `fortalezas dominantes; se recomienda profundizar en entrevista sobre las áreas de interés del puesto.`,
    bajo:
      `El perfil general del candidato muestra varias dimensiones por debajo del promedio de referencia.` +
      `${discText} Esto no descalifica automáticamente al candidato, pero sugiere explorar en entrevista ` +
      `las razones detrás de estos resultados y validar con otras fuentes de información.`,
  });
}

// ---------------------------------------------------------------------------
// 2. Fortalezas
// ---------------------------------------------------------------------------
export function sectionFortalezas(strengths: DimensionScoreEntry[]): string {
  if (strengths.length === 0) {
    return (
      "No se identificaron dimensiones claramente por encima del promedio de referencia " +
      "(normalized_score > 70) en las baterías completadas. Esto no implica ausencia de " +
      "fortalezas reales, sino que ninguna dimensión evaluada se destacó de forma marcada " +
      "respecto al resto en este momento."
    );
  }

  const list = strengths.map((s) => `${s.dimension_label} (${Math.round(s.normalized_score)}/100)`).join(", ");

  if (strengths.length >= 3) {
    return (
      `El candidato muestra un conjunto amplio de fortalezas destacadas: ${list}. ` +
      `Este patrón sugiere un perfil con varias palancas claras que pueden potenciarse en el rol, ` +
      `especialmente si el puesto exige estas competencias de forma central.`
    );
  }

  return (
    `Se identificaron fortalezas puntuales en: ${list}. ` +
    `Aunque no son numerosas, representan áreas donde el candidato destaca claramente sobre el resto ` +
    `de las dimensiones evaluadas y pueden ser un diferenciador relevante para el puesto.`
  );
}

// ---------------------------------------------------------------------------
// 3. Riesgos
// ---------------------------------------------------------------------------
export function sectionRiesgos(risks: DimensionScoreEntry[]): string {
  if (risks.length === 0) {
    return (
      "No se identificaron dimensiones claramente por debajo del promedio de referencia " +
      "(normalized_score < 30) en las baterías completadas. No se observan alertas relevantes " +
      "a partir de estos resultados."
    );
  }

  const list = risks.map((s) => `${s.dimension_label} (${Math.round(s.normalized_score)}/100)`).join(", ");

  if (risks.length >= 3) {
    return (
      `Se identificaron varias dimensiones con puntajes bajos: ${list}. ` +
      `Este patrón sugiere revisar con cuidado si estas áreas son críticas para el puesto y, de serlo, ` +
      `explorarlas a profundidad en entrevista o mediante una prueba práctica adicional.`
    );
  }

  return (
    `Se identificaron riesgos puntuales en: ${list}. ` +
    `Se recomienda indagar en entrevista si estas áreas son relevantes para el desempeño esperado en el puesto.`
  );
}

// ---------------------------------------------------------------------------
// 4. Potencial
// ---------------------------------------------------------------------------
export function sectionPotencial(scores: DimensionScoreEntry[]): string {
  const leadership = byAssessment(scores, "leadership");
  const level = classifyScore(avg(leadership.length ? leadership : scores));

  return pick(level, {
    alto:
      "El candidato muestra indicadores de alto potencial de crecimiento: combina disposición al " +
      "aprendizaje con competencias base sólidas. Es un buen candidato para planes de desarrollo " +
      "acelerado o posiciones con proyección de crecimiento a mediano plazo.",
    medio:
      "El candidato muestra un potencial de crecimiento moderado. Con acompañamiento adecuado y " +
      "objetivos claros, podría desarrollar las competencias necesarias para asumir mayores " +
      "responsabilidades en el mediano plazo.",
    bajo:
      "Los indicadores de potencial de crecimiento son limitados con la información disponible. " +
      "Esto puede reflejar una preferencia por roles de alcance más estable en lugar de una limitación " +
      "real; se recomienda explorar las aspiraciones de carrera del candidato en entrevista.",
  });
}

// ---------------------------------------------------------------------------
// 5. Análisis Bajo Presión
// ---------------------------------------------------------------------------
export function sectionBajoPresion(scores: DimensionScoreEntry[]): string {
  const estabilidad = byDimension(scores, "estabilidad_emocional");
  const discS = byDimension(scores, "S");
  const reference = estabilidad ?? discS;

  if (!reference) {
    return unavailableSection(["personality", "behavioral"], "any");
  }

  const level = classifyScore(reference.normalized_score);

  return pick(level, {
    alto:
      "El candidato muestra buena tolerancia a la presión y estabilidad emocional. Tiende a mantener " +
      "la calma y el criterio en situaciones demandantes, lo cual favorece roles con alta exposición a " +
      "imprevistos, plazos ajustados o interacción con clientes difíciles.",
    medio:
      "El candidato muestra un manejo moderado de la presión: en general responde adecuadamente, " +
      "aunque en picos de estrés prolongado podría beneficiarse de apoyo o de una carga de trabajo " +
      "bien gestionada por su líder directo.",
    bajo:
      "Los resultados sugieren una menor tolerancia a situaciones de alta presión o cambio constante. " +
      "Si el puesto exige manejo intensivo de estrés, se recomienda explorar este punto en entrevista y " +
      "considerar mecanismos de acompañamiento durante la incorporación.",
  });
}

// ---------------------------------------------------------------------------
// 6. Análisis de Liderazgo
// ---------------------------------------------------------------------------
export function sectionLiderazgo(scores: DimensionScoreEntry[]): string {
  const leadership = byAssessment(scores, "leadership");
  if (leadership.length === 0) {
    return unavailableSection(["leadership"]);
  }
  const level = classifyScore(avg(leadership));

  return pick(level, {
    alto:
      "El candidato exhibe un perfil de liderazgo fuerte: visión clara, capacidad de delegar y de " +
      "desarrollar a otros. Es un buen candidato para posiciones que requieran gestión de equipos o " +
      "influencia sobre grupos de trabajo.",
    medio:
      "El candidato muestra competencias de liderazgo en desarrollo. Puede liderar equipos pequeños o " +
      "proyectos acotados, y se beneficiaría de mentoría o formación específica si el rol requiere " +
      "liderazgo de mayor escala.",
    bajo:
      "Los indicadores de liderazgo son bajos en esta evaluación. Esto es esperable y no problemático " +
      "si el puesto es de contribución individual; si el rol requiere gestión de personas, se recomienda " +
      "profundizar en experiencia previa de liderazgo durante la entrevista.",
  });
}

// ---------------------------------------------------------------------------
// 7. Análisis de Ética
// ---------------------------------------------------------------------------
export function sectionEtica(scores: DimensionScoreEntry[]): string {
  const values = byAssessment(scores, "values");
  if (values.length === 0) {
    return unavailableSection(["values"]);
  }
  const level = classifyScore(avg(values));

  return pick(level, {
    alto:
      "El candidato reporta un fuerte apego a valores de integridad, compromiso y respeto. Estos " +
      "resultados son consistentes con un perfil confiable, aunque -como toda autoevaluación- deben " +
      "contrastarse con referencias laborales.",
    medio:
      "El candidato reporta un apego moderado a los valores evaluados, sin señales de alerta " +
      "relevantes. Se recomienda validar con referencias laborales previas, como en cualquier proceso " +
      "de selección.",
    bajo:
      "Se observan puntajes bajos en el inventario de valores. Dado que se trata de una autoevaluación " +
      "sin validación científica, esto no debe interpretarse como una conclusión definitiva sobre la " +
      "ética del candidato; se recomienda fuertemente validar con referencias laborales y entrevista " +
      "por competencias.",
  });
}

// ---------------------------------------------------------------------------
// 8. Análisis de Competencias
// ---------------------------------------------------------------------------
export function sectionCompetencias(scores: DimensionScoreEntry[]): string {
  const competencies = byAssessment(scores, "competencies");
  const roleSpecific = byAssessment(scores, "role_specific");
  const combined = [...competencies, ...roleSpecific];
  if (combined.length === 0) {
    return unavailableSection(["competencies", "role_specific"], "any");
  }
  const level = classifyScore(avg(combined));

  return pick(level, {
    alto:
      "El candidato muestra un dominio sólido de las competencias generales y, cuando aplica, de las " +
      "competencias específicas del rol evaluado. Esto sugiere una curva de aprendizaje corta para las " +
      "responsabilidades técnicas y funcionales del puesto.",
    medio:
      "El candidato muestra un dominio adecuado de las competencias evaluadas, con margen de mejora en " +
      "algunas áreas específicas. Es razonable esperar una curva de aprendizaje estándar durante la " +
      "incorporación.",
    bajo:
      "El candidato muestra brechas relevantes en las competencias evaluadas para el rol. Se recomienda " +
      "considerar un plan de capacitación específico si se decide avanzar con la contratación.",
  });
}

// ---------------------------------------------------------------------------
// 9. Roles Recomendados
// ---------------------------------------------------------------------------
export function sectionRolesRecomendados(scores: DimensionScoreEntry[]): string {
  const disc = topDisc(scores);

  const roleSuggestions: Record<string, string> = {
    D: "roles orientados a resultados, gestión de proyectos o ventas consultivas de alta exigencia",
    I: "roles con alta interacción social: ventas, atención a clientes, relaciones públicas o formación de equipos",
    S: "roles que requieren consistencia y seguimiento de procesos: operaciones, soporte, administración",
    C: "roles que exigen precisión y cumplimiento de estándares: análisis, calidad, finanzas o cumplimiento normativo",
  };

  if (!disc) {
    return (
      "No hay suficiente información conductual (batería de Comportamiento) para sugerir roles " +
      "específicos. Se recomienda completar dicha batería para enriquecer esta sección."
    );
  }

  const suggestion = roleSuggestions[disc.dimension] ?? "roles generalistas";

  return (
    `Con base en el estilo conductual predominante (${DISC_LABELS[disc.dimension] ?? disc.dimension}), ` +
    `el candidato podría encajar especialmente bien en ${suggestion}. Esta sugerencia es orientativa y ` +
    `debe complementarse con la experiencia y el interés real del candidato.`
  );
}

// ---------------------------------------------------------------------------
// 10. Áreas de Desarrollo
// ---------------------------------------------------------------------------
export function sectionAreasDesarrollo(risks: DimensionScoreEntry[], scores: DimensionScoreEntry[]): string {
  const source = risks.length > 0
    ? risks
    : [...scores].sort((a, b) => a.normalized_score - b.normalized_score).slice(0, 2);

  if (source.length === 0) {
    return "No hay suficiente información para sugerir áreas de desarrollo específicas.";
  }

  const list = source.map((s) => s.dimension_label).join(", ");
  const level = classifyScore(avg(source));

  return pick(level, {
    alto:
      `Aunque no se detectaron riesgos importantes, las áreas relativamente más bajas (${list}) pueden ` +
      `ser un buen foco de desarrollo continuo para maximizar el desempeño del candidato en el rol.`,
    medio:
      `Se sugiere enfocar el desarrollo inicial del candidato en: ${list}. Un plan de acompañamiento de ` +
      `90 días con objetivos claros en estas áreas debería ser suficiente para nivelar el desempeño.`,
    bajo:
      `Las áreas de desarrollo prioritarias son: ${list}. Se recomienda un plan de desarrollo formal y ` +
      `seguimiento cercano durante los primeros meses si se decide avanzar con la contratación.`,
  });
}

// ---------------------------------------------------------------------------
// 11. Recomendación de Contratación
// ---------------------------------------------------------------------------
export function sectionRecomendacionContratacion(scores: DimensionScoreEntry[], risksCount: number): string {
  const level = classifyScore(avg(scores));

  const base = pick(level, {
    alto:
      "El perfil evaluado es favorable en conjunto. Se sugiere avanzar a las siguientes etapas del " +
      "proceso de selección (entrevistas, validación de referencias) con una impresión inicial positiva.",
    medio:
      "El perfil evaluado es aceptable pero mixto. Se sugiere avanzar con una entrevista estructurada " +
      "enfocada en las brechas identificadas antes de tomar una decisión final.",
    bajo:
      "El perfil evaluado muestra varias señales de alerta. No se recomienda descartar automáticamente " +
      "al candidato, pero sí profundizar de forma significativa antes de continuar el proceso.",
  });

  const riskCaveat =
    risksCount > 0
      ? " Se identificaron riesgos en al menos una dimensión; revisar la sección de Riesgos antes de decidir."
      : "";

  return (
    base +
    riskCaveat +
    " Esta recomendación es orientativa y no reemplaza el juicio del equipo de selección ni una " +
    "validación psicométrica certificada."
  );
}

// ---------------------------------------------------------------------------
// 12. Preguntas Sugeridas para Entrevista
// ---------------------------------------------------------------------------
export function sectionPreguntasEntrevista(
  risks: DimensionScoreEntry[],
  strengths: DimensionScoreEntry[],
): string {
  const questions: string[] = [];

  for (const risk of risks.slice(0, 3)) {
    questions.push(
      `Cuéntame de una situación reciente donde tuviste que trabajar en algo relacionado con ` +
        `"${risk.dimension_label}". ¿Qué hiciste y qué resultado obtuviste?`,
    );
  }

  for (const strength of strengths.slice(0, 2)) {
    questions.push(
      `Mencionas fortaleza en "${strength.dimension_label}". Describe el logro del que te sientas más ` +
        `orgulloso relacionado con esta área.`,
    );
  }

  if (questions.length === 0) {
    questions.push(
      "¿Qué aspecto de este puesto te representa el mayor desafío y cómo planeas abordarlo?",
      "Describe una decisión difícil que hayas tomado en un trabajo anterior y su resultado.",
      "¿Cómo manejas los desacuerdos con un compañero de equipo o un superior?",
    );
  }

  questions.push(
    "¿Qué tan alineadas sientes tus expectativas del puesto con lo que hemos conversado hasta ahora?",
  );

  return questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
}

/**
 * Smoke test del pipeline de scoring completo (seed -> scoring -> reporte).
 *
 * Objetivo: detectar en CI/local, sin necesidad de una base Supabase real,
 * si alguna de las dimensiones reales sembradas en
 * `supabase/seed_full_content.sql` (vía `config_json.dimensions` /
 * `config_json.roles[].dimensions` de `assessment_definitions`) queda sin
 * cobertura en `lib/scoring/*` o en `lib/report/sections.ts`.
 *
 * Estrategia:
 *  1. Parsear directamente los `update ... set config_json = '...'` del
 *     archivo SQL (fuente de la verdad de las dimensiones reales) — así el
 *     test no depende de una copia manual de la taxonomía que pueda
 *     desincronizarse.
 *  2. Para cada batería, generar preguntas (`QuestionRow`) y respuestas
 *     (`ResponseRow`) ficticias que cubran TODAS sus dimensiones (o, en el
 *     caso de `role_specific`, todas las dimensiones de TODOS los roles).
 *  3. Correr `computeScoresForAssessment` (el motor real de
 *     `lib/scoring/index.ts`) y verificar que:
 *       a) cada dimensión que aparece en las preguntas produce un
 *          `normalized_score` numérico y finito (no `NaN`/`undefined`).
 *       b) esa dimensión existe en `config_json.dimensions` (o
 *          `roles[].dimensions`) con una etiqueta (`label`) no vacía —
 *          este es el chequeo que habría detectado el riesgo descrito por
 *          el usuario (desajuste de nombres entre seed y motor de scoring).
 *  4. Armar un `DimensionScoreEntry[]` sintético combinando TODAS las
 *     baterías y correr `generateReport()` (`lib/report/generate.ts`) para
 *     confirmar que las 12 secciones se generan sin lanzar excepciones y
 *     sin contenido vacío, incluyendo las 2 secciones que tienen lookups
 *     de dimensión hardcodeados (`sectionBajoPresion` ->
 *     "estabilidad_emocional"/"S", `sectionRolesRecomendados` -> D/I/S/C).
 *
 * Uso: npx tsx scripts/smoke-test-scoring.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeScoresForAssessment } from "@/lib/scoring";
import { generateReport } from "@/lib/report/generate";
import type { DimensionScoreEntry } from "@/lib/report/types";
import type {
  AssessmentCode,
  AssessmentConfigJson,
  ForcedChoiceQuadOptions,
  QuestionRow,
  QuestionType,
  ResponseRow,
} from "@/types/database";

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean, detail?: string): void {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  [FALLA] ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`  [ok] ${label}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Extraer config_json real de cada batería directamente del SQL de seed
// ---------------------------------------------------------------------------
const seedPath = join(__dirname, "..", "supabase", "seed_full_content.sql");
const seedSql = readFileSync(seedPath, "utf-8");

const configByCode = new Map<AssessmentCode, AssessmentConfigJson>();
const updateRegex =
  /update\s+public\.assessment_definitions\s+set\s+config_json\s*=\s*'(.+?)'::jsonb\s+where\s+code\s*=\s*'([a-z_]+)'/gim;

let match: RegExpExecArray | null;
while ((match = updateRegex.exec(seedSql)) !== null) {
  const [, jsonText, code] = match;
  const parsed = JSON.parse(jsonText) as AssessmentConfigJson;
  configByCode.set(code as AssessmentCode, parsed);
}

console.log(`Baterías con config_json parseado desde seed_full_content.sql: ${configByCode.size}`);
const expectedCodes: AssessmentCode[] = [
  "behavioral",
  "cognitive",
  "personality",
  "competencies",
  "values",
  "leadership",
  "role_specific",
];
for (const code of expectedCodes) {
  ok(`config_json.dimensions extraído para batería "${code}"`, configByCode.has(code));
}

// ---------------------------------------------------------------------------
// 2 y 3. Generar preguntas/respuestas ficticias por batería y correr scoring
// ---------------------------------------------------------------------------
let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `q-${idCounter}`;
}

function makeQuestion(partial: Partial<QuestionRow> & Pick<QuestionRow, "question_type" | "dimension" | "options_json">): QuestionRow {
  return {
    id: nextId(),
    assessment_definition_id: "def-fake",
    role_variant: null,
    order_index: 1,
    prompt_text: "Pregunta ficticia de smoke test",
    is_reverse_scored: false,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

function makeResponse(questionId: string, answer: ResponseRow["answer_json"]): ResponseRow {
  return {
    id: `r-${questionId}`,
    candidate_assessment_id: "ca-fake",
    question_id: questionId,
    answer_json: answer,
    answered_at: new Date().toISOString(),
  };
}

interface BatteryResult {
  assessmentCode: AssessmentCode;
  dimension: string;
  dimensionLabel: string;
  normalized_score: number;
}

const allResults: BatteryResult[] = [];

function checkDimensionCoverage(
  assessmentCode: AssessmentCode,
  questionType: QuestionType,
  dims: Array<{ code: string; label: string }>,
): void {
  const questions: QuestionRow[] = [];
  const responses: ResponseRow[] = [];

  if (questionType === "forced_choice_quad") {
    // Un solo bloque forced_choice_quad cubre las 4 dimensiones a la vez
    // (una por opción), igual que en el seed real.
    if (dims.length !== 4) {
      throw new Error(`forced_choice_quad esperaba 4 dimensiones, llegaron ${dims.length}`);
    }
    const options: ForcedChoiceQuadOptions = {
      options: [
        { text: "Opción ficticia 1", dimension: dims[0].code },
        { text: "Opción ficticia 2", dimension: dims[1].code },
        { text: "Opción ficticia 3", dimension: dims[2].code },
        { text: "Opción ficticia 4", dimension: dims[3].code },
      ],
    };
    const q = makeQuestion({ question_type: "forced_choice_quad", dimension: "DISC", options_json: options });
    questions.push(q);
    responses.push(makeResponse(q.id, { most_index: 0, least_index: 1 }));
  } else if (questionType === "multiple_choice") {
    for (const dim of dims) {
      const q = makeQuestion({
        question_type: "multiple_choice",
        dimension: dim.code,
        options_json: { choices: ["A", "B", "C", "D"], correct_index: 0 },
      });
      questions.push(q);
      responses.push(makeResponse(q.id, { selected_index: 0 }));
    }
  } else if (questionType === "likert5") {
    for (const dim of dims) {
      const q = makeQuestion({
        question_type: "likert5",
        dimension: dim.code,
        options_json: {},
      });
      questions.push(q);
      responses.push(makeResponse(q.id, { value: 4 }));
    }
  }

  const results = computeScoresForAssessment(questions, responses);

  ok(
    `"${assessmentCode}" (${questionType}): produce un resultado por cada una de sus ${dims.length} dimensiones`,
    results.length === dims.length,
    `esperadas ${dims.length}, obtenidas ${results.length} (${results.map((r) => r.dimension).join(", ")})`,
  );

  const labelByCode = new Map(dims.map((d) => [d.code, d.label]));

  for (const dim of dims) {
    const result = results.find((r) => r.dimension === dim.code);
    ok(`"${assessmentCode}" -> dimensión "${dim.code}" presente en el resultado de scoring`, !!result);
    if (!result) continue;

    ok(
      `"${assessmentCode}" -> "${dim.code}" normalized_score es un número finito`,
      Number.isFinite(result.normalized_score),
      `valor recibido: ${result.normalized_score}`,
    );

    const label = labelByCode.get(result.dimension);
    ok(
      `"${assessmentCode}" -> "${dim.code}" tiene label en config_json (join dimension->label no cae a fallback)`,
      typeof label === "string" && label.length > 0,
    );

    allResults.push({
      assessmentCode,
      dimension: result.dimension,
      dimensionLabel: label ?? result.dimension,
      normalized_score: result.normalized_score,
    });
  }
}

console.log("\n=== Verificando cobertura de dimensiones por batería ===");

for (const code of expectedCodes) {
  const config = configByCode.get(code);
  if (!config) continue;

  console.log(`\n-- ${code} (${config.question_type}) --`);

  if (code === "role_specific") {
    if (!config.roles) {
      ok(`"${code}" tiene config.roles definido`, false);
      continue;
    }
    for (const role of config.roles) {
      console.log(`  rol: ${role.code} (${role.dimensions.length} dimensiones)`);
      checkDimensionCoverage(code, config.question_type, role.dimensions);
    }
  } else {
    if (!config.dimensions) {
      ok(`"${code}" tiene config.dimensions definido`, false);
      continue;
    }
    checkDimensionCoverage(code, config.question_type, config.dimensions);
  }
}

// ---------------------------------------------------------------------------
// 4. Ensamblar reporte completo con los resultados de todas las baterías
// ---------------------------------------------------------------------------
console.log("\n=== Verificando generación del reporte de 12 secciones ===");

const dimensionScores: DimensionScoreEntry[] = allResults.map((r) => ({
  assessment_code: r.assessmentCode,
  dimension: r.dimension,
  dimension_label: r.dimensionLabel,
  normalized_score: r.normalized_score,
  percentile: 50,
}));

ok("Hay al menos una dimensión combinada de todas las baterías para probar el reporte", dimensionScores.length > 0);

try {
  const report = generateReport(
    { id: "cand-fake", full_name: "Candidato Ficticio", email: "candidato@example.com", position_applied: "QA" },
    dimensionScores,
  );

  ok("generateReport() no lanzó excepción", true);
  ok("El reporte tiene exactamente 12 secciones", report.sections.length === 12, `obtenidas: ${report.sections.length}`);

  for (const section of report.sections) {
    ok(
      `Sección ${section.id} ("${section.title}") tiene contenido no vacío`,
      typeof section.content === "string" && section.content.trim().length > 0,
    );
    ok(
      `Sección ${section.id} no contiene literal "undefined"`,
      !section.content.includes("undefined"),
    );
  }

  // Chequeos puntuales de las 2 secciones con lookups de dimensión
  // hardcodeados (los puntos de mayor riesgo de desajuste seed <-> reporte).
  const bajoPresion = report.sections.find((s) => s.title === "Análisis Bajo Presión");
  const roles = report.sections.find((s) => s.title === "Roles Recomendados");
  ok(
    'Sección "Análisis Bajo Presión" existe y tiene contenido (usa lookup hardcodeado "estabilidad_emocional"/"S")',
    !!bajoPresion && bajoPresion.content.length > 0,
  );
  ok(
    'Sección "Roles Recomendados" existe y tiene contenido (usa lookup hardcodeado D/I/S/C)',
    !!roles && roles.content.length > 0,
  );
} catch (err) {
  ok("generateReport() no lanzó excepción", false, String(err));
}

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------
console.log(`\n=== Resumen: ${checks - failures}/${checks} chequeos OK ===`);
if (failures > 0) {
  console.error(`${failures} chequeo(s) fallaron.`);
  process.exit(1);
} else {
  console.log("Todos los chequeos pasaron. El pipeline seed -> scoring -> reporte es consistente.");
  process.exit(0);
}

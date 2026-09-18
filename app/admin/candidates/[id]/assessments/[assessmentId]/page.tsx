import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSESSMENT_DEFINITIONS_META } from "@/lib/constants";
import type {
  AssessmentConfigJson,
  ForcedChoiceQuadAnswer,
  ForcedChoiceQuadOptions,
  Likert5Answer,
  Likert5Options,
  MultipleChoiceAnswer,
  MultipleChoiceOptions,
  QuestionRow,
  ResponseRow,
} from "@/types/database";

const DEFAULT_LIKERT_LABELS = [
  "Muy en desacuerdo",
  "En desacuerdo",
  "Neutral",
  "De acuerdo",
  "Muy de acuerdo",
];

/**
 * Visor de respuestas individuales de UNA candidate_assessment (Fase B),
 * pregunta por pregunta, con detalle según `question_type`. Usa la SERVICE
 * ROLE (`lib/supabase/admin.ts`) porque necesita `options_json.correct_index`
 * (multiple_choice) y el detalle completo de las 4 frases de cada bloque
 * (forced_choice_quad), datos que las RPC del candidato (`get_assessment_detail`
 * en migrations_v2.sql) nunca exponen. Esto es seguro porque esta página
 * vive detrás de `middleware.ts` (exige sesión de ADMIN) y, antes de usar la
 * service role, se verifica a mano que el candidato pertenece al admin en
 * sesión (la service role bypassa RLS, así que esa verificación NO puede
 * delegarse a Postgres aquí).
 */
export default async function CandidateAssessmentViewerPage({
  params,
}: {
  params: Promise<{ id: string; assessmentId: string }>;
}) {
  const { id: candidateId, assessmentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Verificación explícita de propiedad ANTES de usar la service role: sin
  // esto, cualquier admin autenticado podría ver las respuestas de
  // candidatos de otro admin con solo cambiar el id en la URL.
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, full_name, email, admin_id")
    .eq("id", candidateId)
    .single();

  if (!candidate || candidate.admin_id !== user.id) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: ca } = await admin
    .from("candidate_assessments")
    .select("id, candidate_id, assessment_definition_id, role_variant, status, time_limit_minutes, started_at, completed_at, completed_by_timeout")
    .eq("id", assessmentId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (!ca) {
    notFound();
  }

  // Se capturan en variables locales inmediatamente después del narrowing
  // (en vez de seguir leyendo `ca.*` dentro de closures/JSX más abajo) para
  // que TypeScript no vuelva a tratar `ca` como potencialmente null.
  const caId = ca.id;
  const caDefinitionId = ca.assessment_definition_id;
  const caRoleVariant = ca.role_variant;
  const caStatus = ca.status;
  const caCompletedByTimeout = ca.completed_by_timeout;

  const [{ data: definition }, { data: questions }, { data: responses }, { data: scores }] = await Promise.all([
    admin.from("assessment_definitions").select("*").eq("id", caDefinitionId).single(),
    admin.from("questions").select("*").eq("assessment_definition_id", caDefinitionId).order("order_index"),
    admin.from("responses").select("*").eq("candidate_assessment_id", caId),
    admin.from("scores").select("*").eq("candidate_assessment_id", caId),
  ]);

  const roleFilteredQuestions = (questions ?? []).filter((q) => q.role_variant === caRoleVariant);
  const responseByQuestionId = new Map((responses ?? []).map((r) => [r.question_id, r]));
  const scoreByDimension = new Map((scores ?? []).map((s) => [s.dimension, s]));
  const meta = ASSESSMENT_DEFINITIONS_META.find((m) => m.code === definition?.code);

  function dimensionLabel(dimensionCode: string): string {
    const config = definition?.config_json as AssessmentConfigJson | undefined;
    if (!config) return dimensionCode;
    if (config.roles) {
      const role = config.roles.find((r) => r.code === caRoleVariant);
      return role?.dimensions.find((d) => d.code === dimensionCode)?.label ?? dimensionCode;
    }
    return config.dimensions?.find((d) => d.code === dimensionCode)?.label ?? dimensionCode;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link href={`/admin/candidates/${candidateId}`} className="text-sm text-indigo-700 hover:underline">
          ← Volver a {candidate.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-indigo-950">
          Respuestas: {definition?.name ?? meta?.name ?? "Batería"}
        </h1>
        <p className="text-sm text-gray-500">
          Estado: {caStatus}
          {caCompletedByTimeout ? " (por tiempo agotado)" : ""} · {roleFilteredQuestions.length} preguntas ·{" "}
          {responses?.length ?? 0} respondidas
        </p>
      </div>

      {roleFilteredQuestions.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-400">
          No hay preguntas para esta batería/rol.
        </p>
      )}

      <div className="space-y-4">
        {roleFilteredQuestions.map((question, idx) => (
          <QuestionCard
            key={question.id}
            index={idx + 1}
            question={question}
            response={responseByQuestionId.get(question.id)}
            dimensionLabel={dimensionLabel}
            score={scoreByDimension.get(question.dimension)}
          />
        ))}
      </div>
    </main>
  );
}

function QuestionCard({
  index,
  question,
  response,
  dimensionLabel,
  score,
}: {
  index: number;
  question: QuestionRow;
  response: ResponseRow | undefined;
  dimensionLabel: (code: string) => string;
  score: { normalized_score: number; raw_score: number } | undefined;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">Pregunta {index}</p>
      {question.question_type === "forced_choice_quad" && (
        <ForcedChoiceQuadDetail question={question} response={response} />
      )}
      {question.question_type === "multiple_choice" && (
        <MultipleChoiceDetail question={question} response={response} dimensionLabel={dimensionLabel} score={score} />
      )}
      {question.question_type === "likert5" && (
        <Likert5Detail question={question} response={response} dimensionLabel={dimensionLabel} />
      )}
    </div>
  );
}

function ForcedChoiceQuadDetail({
  question,
  response,
}: {
  question: QuestionRow;
  response: ResponseRow | undefined;
}) {
  const options = question.options_json as ForcedChoiceQuadOptions;
  const answer = response?.answer_json as ForcedChoiceQuadAnswer | undefined;

  return (
    <div className="space-y-2">
      <p className="font-medium text-gray-800">{question.prompt_text}</p>
      <table className="w-full text-sm">
        <thead className="text-gray-500">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Afirmación</th>
            <th className="px-2 py-1 text-left font-medium">Dimensión</th>
            <th className="px-2 py-1 text-center font-medium">Marca</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {options.options.map((opt, idx) => {
            const isMost = answer?.most_index === idx;
            const isLeast = answer?.least_index === idx;
            return (
              <tr key={idx}>
                <td className="px-2 py-2">{opt.text}</td>
                <td className="px-2 py-2 text-gray-500">{opt.dimension}</td>
                <td className="px-2 py-2 text-center">
                  {isMost && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">MÁS como yo</span>}
                  {isLeast && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">MENOS como yo</span>}
                  {!isMost && !isLeast && <span className="text-gray-300">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {answer ? (
        <p className="text-xs text-gray-500">
          Puntuación que aportó este bloque:{" "}
          <span className="font-medium text-green-700">+1 a {options.options[answer.most_index]?.dimension}</span>
          {", "}
          <span className="font-medium text-red-700">-1 a {options.options[answer.least_index]?.dimension}</span>
        </p>
      ) : (
        <p className="text-xs text-gray-400">Sin responder.</p>
      )}
    </div>
  );
}

function MultipleChoiceDetail({
  question,
  response,
  dimensionLabel,
  score,
}: {
  question: QuestionRow;
  response: ResponseRow | undefined;
  dimensionLabel: (code: string) => string;
  score: { normalized_score: number; raw_score: number } | undefined;
}) {
  const options = question.options_json as MultipleChoiceOptions;
  const answer = response?.answer_json as MultipleChoiceAnswer | undefined;
  const isCorrect =
    answer !== undefined && typeof options.correct_index === "number"
      ? answer.selected_index === options.correct_index
      : null;

  return (
    <div className="space-y-2">
      <p className="font-medium text-gray-800">{question.prompt_text}</p>
      <p className="text-xs text-gray-500">Dimensión: {dimensionLabel(question.dimension)}</p>
      <ul className="space-y-1 text-sm">
        {options.choices.map((choice, idx) => {
          const isSelected = answer?.selected_index === idx;
          const isCorrectChoice = options.correct_index === idx;
          return (
            <li
              key={idx}
              className={`rounded-md border px-3 py-2 ${
                isCorrectChoice
                  ? "border-green-300 bg-green-50"
                  : isSelected
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
              }`}
            >
              {choice}
              {isCorrectChoice && <span className="ml-2 text-xs font-medium text-green-700">(correcta)</span>}
              {isSelected && !isCorrectChoice && <span className="ml-2 text-xs font-medium text-red-700">(seleccionada)</span>}
              {isSelected && isCorrectChoice && <span className="ml-2 text-xs font-medium text-green-700">(seleccionada)</span>}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-500">
        {answer === undefined
          ? "Sin responder."
          : isCorrect
            ? "✔ Acertó esta pregunta."
            : "✘ No acertó esta pregunta."}
        {score && ` · Score de la dimensión: ${Math.round(score.normalized_score)}/100 (agregado, no solo esta pregunta)`}
      </p>
    </div>
  );
}

function Likert5Detail({
  question,
  response,
  dimensionLabel,
}: {
  question: QuestionRow;
  response: ResponseRow | undefined;
  dimensionLabel: (code: string) => string;
}) {
  const options = question.options_json as Likert5Options;
  const labels = options.scale_labels ?? DEFAULT_LIKERT_LABELS;
  const answer = response?.answer_json as Likert5Answer | undefined;
  const usedValue = answer ? (question.is_reverse_scored ? 6 - answer.value : answer.value) : null;

  return (
    <div className="space-y-2">
      <p className="font-medium text-gray-800">{question.prompt_text}</p>
      <p className="text-xs text-gray-500">
        Dimensión: {dimensionLabel(question.dimension)}
        {question.is_reverse_scored && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">Scoring inverso</span>
        )}
      </p>
      {answer ? (
        <div className="text-sm">
          <p>
            Respuesta: <span className="font-medium text-gray-800">{answer.value} — {labels[answer.value - 1]}</span>
          </p>
          {question.is_reverse_scored && (
            <p className="text-xs text-gray-500">
              Valor usado en el cálculo (invertido, 6 − {answer.value}): <span className="font-medium">{usedValue}</span>
            </p>
          )}
          {!question.is_reverse_scored && (
            <p className="text-xs text-gray-500">
              Valor usado en el cálculo: <span className="font-medium">{usedValue}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Sin responder.</p>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignAssessmentForm } from "@/components/admin/AssignAssessmentForm";
import { AssessmentRowActions } from "@/components/admin/AssessmentRowActions";
import { ScoreChart } from "@/components/admin/ScoreChart";
import { GenerateReportButton } from "@/components/admin/GenerateReportButton";
import { fetchDimensionScoresForCandidate } from "@/lib/report/fetchScores";
import { ASSESSMENT_DEFINITIONS_META } from "@/lib/constants";

// "expired" y "revoked" se agregaron en la Fase A (migrations_v2.sql) para
// el motor de tiempo real de examen del portal nuevo por sesión.
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  expired: "Tiempo agotado",
  revoked: "Anulada",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-700",
  revoked: "bg-gray-200 text-gray-600",
};

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: candidate } = await supabase.from("candidates").select("*").eq("id", id).single();

  if (!candidate) {
    notFound();
  }

  const [{ data: definitions }, { data: candidateAssessments }, { data: latestReport }] = await Promise.all([
    supabase.from("assessment_definitions").select("id, code, name").order("code"),
    supabase
      .from("candidate_assessments")
      .select(
        "id, assessment_definition_id, role_variant, status, unique_token, created_at, time_limit_minutes, completed_by_timeout",
      )
      .eq("candidate_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reports")
      .select("id, generated_at")
      .eq("candidate_id", id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const dimensionScores = await fetchDimensionScoresForCandidate(supabase, id);

  const definitionById = new Map((definitions ?? []).map((d) => [d.id, d]));

  const chartData = dimensionScores.map((s) => ({ dimension: s.dimension_label, score: s.normalized_score }));

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link href="/admin/candidates" className="text-sm text-indigo-700 hover:underline">
          ← Volver a candidatos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-indigo-950">{candidate.full_name}</h1>
        <p className="text-sm text-gray-500">
          {candidate.email} {candidate.phone ? `· ${candidate.phone}` : ""}
        </p>
        <p className="text-sm text-gray-500">Puesto aplicado: {candidate.position_applied ?? "No especificado"}</p>
        {candidate.notes && <p className="mt-2 text-sm text-gray-600">Notas: {candidate.notes}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AssignAssessmentForm
          candidateId={id}
          definitions={(definitions ?? []).map((d) => ({ id: d.id, code: d.code, name: d.name }))}
        />

        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-indigo-950">Progreso de evaluaciones asignadas</h3>
          {(candidateAssessments ?? []).length === 0 && (
            <p className="text-sm text-gray-400">Aún no se ha asignado ninguna evaluación.</p>
          )}
          <ul className="divide-y divide-gray-100">
            {(candidateAssessments ?? []).map((ca) => {
              const def = definitionById.get(ca.assessment_definition_id);
              const meta = ASSESSMENT_DEFINITIONS_META.find((m) => m.code === def?.code);
              return (
                <li key={ca.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{def?.name ?? meta?.name ?? "Batería"}</p>
                    {ca.role_variant && <p className="text-xs text-gray-500">Rol: {ca.role_variant}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[ca.status] ?? "bg-gray-100"}`}
                      >
                        {STATUS_LABELS[ca.status] ?? ca.status}
                      </span>
                      {ca.status === "expired" && ca.completed_by_timeout && (
                        <span className="text-xs text-gray-400">(tiempo agotado, no finalizada a mano)</span>
                      )}
                    </div>
                  </div>
                  <AssessmentRowActions
                    candidateId={id}
                    candidateAssessmentId={ca.id}
                    status={ca.status}
                    timeLimitMinutes={ca.time_limit_minutes}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-indigo-950">Resultados</h3>
          <div className="flex items-center gap-3">
            {latestReport && (
              <Link href={`/admin/candidates/${id}/report`} className="text-sm text-indigo-700 hover:underline">
                Ver reporte completo
              </Link>
            )}
            <GenerateReportButton candidateId={id} hasReport={Boolean(latestReport)} />
          </div>
        </div>

        {dimensionScores.length === 0 ? (
          <p className="text-sm text-gray-400">
            Aún no hay puntajes calculados. Se generan automáticamente cuando el candidato completa una batería.
          </p>
        ) : (
          <>
            <ScoreChart data={chartData} />
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Batería</th>
                    <th className="px-3 py-2 font-medium">Dimensión</th>
                    <th className="px-3 py-2 font-medium">Score normalizado</th>
                    <th className="px-3 py-2 font-medium">Percentil (ilustrativo)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dimensionScores.map((s) => (
                    <tr key={`${s.assessment_code}-${s.dimension}`}>
                      <td className="px-3 py-2 text-gray-600">{s.assessment_code}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{s.dimension_label}</td>
                      <td className="px-3 py-2">{Math.round(s.normalized_score)} / 100</td>
                      <td className="px-3 py-2">{s.percentile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

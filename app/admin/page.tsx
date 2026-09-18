import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-indigo-950">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalCandidates },
    { count: pendingCount },
    { count: inProgressCount },
    { count: completedCount },
    { count: expiredCount },
    { count: revokedCount },
    { data: scoreRows },
    { data: reportRows },
    { data: completedAssessmentRows },
  ] = await Promise.all([
    supabase.from("candidates").select("*", { count: "exact", head: true }),
    supabase
      .from("candidate_assessments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("candidate_assessments")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("candidate_assessments")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),
    // "expired": batería que llegó a 'in_progress' y se le acabó el tiempo
    // real de examen (Fase A / migrations_v2.sql).
    supabase
      .from("candidate_assessments")
      .select("*", { count: "exact", head: true })
      .eq("status", "expired"),
    // "revoked": anulada por el admin (Fase B).
    supabase
      .from("candidate_assessments")
      .select("*", { count: "exact", head: true })
      .eq("status", "revoked"),
    supabase.from("scores").select("normalized_score"),
    supabase.from("reports").select("candidate_id"),
    supabase.from("candidate_assessments").select("candidate_id").eq("status", "completed"),
  ]);

  const averageScore =
    scoreRows && scoreRows.length > 0
      ? Math.round(
          scoreRows.reduce((sum, s) => sum + Number(s.normalized_score), 0) / scoreRows.length,
        )
      : null;

  // Reportes generados vs. pendientes de generar: se compara, por
  // candidato (no por fila), quién tiene AL MENOS un reporte generado
  // contra quién tiene AL MENOS una batería 'completed' pero ningún
  // reporte todavía (Fase B). Se hace en JS (en vez de una vista SQL) para
  // no requerir otra migración solo por una métrica del dashboard.
  const candidatesWithReport = new Set((reportRows ?? []).map((r) => r.candidate_id));
  const candidatesWithCompletedAssessment = new Set((completedAssessmentRows ?? []).map((r) => r.candidate_id));
  const candidatesPendingReport = Array.from(candidatesWithCompletedAssessment).filter(
    (id) => !candidatesWithReport.has(id),
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-950">Dashboard</h1>
        <Link
          href="/admin/candidates"
          className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
        >
          Ver candidatos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total de candidatos" value={totalCandidates ?? 0} />
        <MetricCard label="Evaluaciones pendientes" value={pendingCount ?? 0} />
        <MetricCard label="Evaluaciones en progreso" value={inProgressCount ?? 0} />
        <MetricCard label="Evaluaciones completadas" value={completedCount ?? 0} />
        <MetricCard label="Evaluaciones con tiempo agotado" value={expiredCount ?? 0} />
        <MetricCard label="Evaluaciones revocadas" value={revokedCount ?? 0} />
        <MetricCard
          label="Score promedio general"
          value={averageScore !== null ? `${averageScore} / 100` : "Sin datos aún"}
        />
        <MetricCard label="Candidatos con reporte generado" value={candidatesWithReport.size} />
        <MetricCard label="Candidatos con resultados pendientes de reporte" value={candidatesPendingReport.length} />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-indigo-950">Próximos pasos</h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
          <li>
            Crea un candidato desde <Link className="text-indigo-700 underline" href="/admin/candidates/new">Nuevo candidato</Link>.
          </li>
          <li>Desde el detalle del candidato, asígnale una o varias baterías de evaluación.</li>
          <li>
            El candidato inicia sesión con el correo y la contraseña temporal que le compartiste al crearlo
            (mostrada una sola vez al momento de crear su ficha) — no hay ningún link adicional que enviar.
          </li>
          <li>
            Cuando complete sus baterías, revisa sus resultados y genera su reporte de 12 secciones en PDF.
          </li>
        </ul>
      </section>
    </main>
  );
}

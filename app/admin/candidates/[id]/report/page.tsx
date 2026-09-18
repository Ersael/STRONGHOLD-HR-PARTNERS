import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ASSESSMENT_DEFINITIONS_META } from "@/lib/constants";
import type { ReportJson } from "@/types/database";

function batteryName(code: string): string {
  return ASSESSMENT_DEFINITIONS_META.find((m) => m.code === code)?.name ?? code;
}

export default async function CandidateReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reportRow } = await supabase
    .from("reports")
    .select("*")
    .eq("candidate_id", id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reportRow) {
    notFound();
  }

  const report = reportRow.report_json as ReportJson;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/admin/candidates/${id}`} className="text-sm text-indigo-700 hover:underline">
            ← Volver al candidato
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-indigo-950">Reporte: {report.candidate.full_name}</h1>
          <p className="text-sm text-gray-500">
            Generado el {new Date(report.generated_at).toLocaleString("es-MX")}
          </p>
        </div>
        <a
          href={`/api/reports/${id}/pdf`}
          className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
        >
          Descargar PDF
        </a>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {report.ethical_notice}
      </div>

      {report.partial && (
        <div className="rounded-xl border border-amber-300 bg-amber-100 p-4 text-sm text-amber-900">
          <p className="font-semibold">Resultados parciales</p>
          <p className="mt-1">
            Pruebas completadas:{" "}
            {report.completed_assessments.length > 0
              ? report.completed_assessments.map(batteryName).join(", ")
              : "ninguna"}
            . Pruebas pendientes: {report.pending_assessments.map(batteryName).join(", ")}.
          </p>
          <p className="mt-1 text-xs">
            Las secciones que dependen por completo de una batería pendiente lo indican explícitamente en
            vez de mostrar contenido genérico o inventado. Regenera el reporte cuando el candidato complete
            las baterías faltantes.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {report.dimension_scores.map((d) => (
          <div key={`${d.assessment_code}-${d.dimension}`} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs text-gray-500">{d.dimension_label}</p>
            <p className="text-xl font-bold text-indigo-950">{Math.round(d.normalized_score)}</p>
            <p className="text-xs capitalize text-gray-400">{d.level} · percentil {d.percentile}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {report.sections.map((section) => (
          <section key={section.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 font-semibold text-indigo-950">
              {section.id}. {section.title}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{section.content}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

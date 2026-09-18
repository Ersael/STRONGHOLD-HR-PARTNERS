import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAssessmentCompletionStatus, fetchDimensionScoresForCandidate } from "@/lib/report/fetchScores";
import { generateReport } from "@/lib/report/generate";
import { logAuditEvent } from "@/lib/audit/log";

/**
 * POST /api/reports/[candidateId]
 * Genera (o regenera) el reporte de 12 secciones para un candidato del
 * admin autenticado, lo guarda en `reports` y lo devuelve.
 */
export async function POST(_request: Request, context: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id, full_name, email, position_applied")
    .eq("id", candidateId)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
  }

  const dimensionScores = await fetchDimensionScoresForCandidate(supabase, candidateId);

  if (dimensionScores.length === 0) {
    return NextResponse.json(
      { error: "El candidato aún no tiene baterías completadas con puntajes calculados" },
      { status: 400 },
    );
  }

  const assessmentStatus = await fetchAssessmentCompletionStatus(supabase, candidateId);
  const report = generateReport(candidate, dimensionScores, assessmentStatus);

  const { data: savedReport, error: saveError } = await supabase
    .from("reports")
    .insert({ candidate_id: candidateId, report_json: report })
    .select()
    .single();

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  await logAuditEvent({
    actorId: user.id,
    actorType: "admin",
    action: "report_generated",
    entityType: "report",
    entityId: savedReport.id,
    metadata: { candidate_id: candidateId, partial: report.partial },
  });

  return NextResponse.json({ report: savedReport });
}

/**
 * GET /api/reports/[candidateId] - obtiene el último reporte generado.
 */
export async function GET(_request: Request, context: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}

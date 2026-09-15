import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ReportDocument } from "@/components/pdf/ReportDocument";
import type { ReportJson } from "@/types/database";

// @react-pdf/renderer usa APIs de Node (buffers, fuentes) que no corren en
// el runtime "edge" de Next.js.
export const runtime = "nodejs";

/**
 * GET /api/reports/[candidateId]/pdf
 * Renderiza a PDF el último reporte generado para el candidato y lo
 * entrega como descarga. Requiere sesión de admin (RLS protege `reports`).
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

  const { data: reportRow, error } = await supabase
    .from("reports")
    .select("report_json, candidate_id")
    .eq("candidate_id", candidateId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!reportRow) {
    return NextResponse.json({ error: "No hay un reporte generado para este candidato" }, { status: 404 });
  }

  const report = reportRow.report_json as ReportJson;
  const buffer = await renderToBuffer(<ReportDocument report={report} />);

  const fileName = `reporte-${report.candidate.full_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

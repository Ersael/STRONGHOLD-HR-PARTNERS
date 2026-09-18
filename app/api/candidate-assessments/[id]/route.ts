import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";
import type { CandidateAssessmentRow } from "@/types/database";

const patchSchema = z
  .object({
    time_limit_minutes: z.number().int().min(5).max(240).optional(),
    status: z.literal("revoked").optional(),
  })
  .refine((v) => v.time_limit_minutes !== undefined || v.status !== undefined, {
    message: "Nada que actualizar",
  });

/**
 * PATCH /api/candidate-assessments/[id]
 *
 * Dos acciones administrativas sobre UNA `candidate_assessment` (Fase B),
 * cada una con su propia regla de negocio:
 *
 *  - `time_limit_minutes`: solo editable mientras la batería sigue
 *    `pending` (el candidato no ha presionado "Iniciar" todavía). Una vez
 *    `in_progress` o posterior, el tiempo límite queda congelado para no
 *    permitir manipular un examen en curso — se rechaza con 409.
 *  - `status: "revoked"`: el admin anula una prueba asignada (ej. el
 *    candidato ya no aplica al puesto). Solo permitido desde `pending` o
 *    `in_progress`; una prueba ya `completed`/`expired`/`revoked` no puede
 *    revocarse (no tiene sentido / ya es terminal). Una vez `revoked`, el
 *    candidato deja de poder actuar sobre ella (ver
 *    components/candidate/CandidateDashboardClient.tsx y las RPC de
 *    migrations_v2.sql, que ya rechazan escrituras fuera de 'in_progress').
 *
 * La autorización de "es tuyo este candidato" la resuelve RLS directamente
 * (policy `candidate_assessments_owner`, ya `for all` para el admin dueño
 * desde schema.sql) — no se necesita la service role aquí, solo para el
 * audit log.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { data: current, error: fetchError } = await supabase
    .from("candidate_assessments")
    .select("id, status, time_limit_minutes")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Evaluación asignada no encontrada" }, { status: 404 });
  }

  const updates: Partial<CandidateAssessmentRow> = {};

  if (parsed.data.time_limit_minutes !== undefined) {
    if (current.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "El tiempo límite ya no se puede editar: la batería no está pendiente (ya fue iniciada o cerrada por el candidato).",
        },
        { status: 409 },
      );
    }
    updates.time_limit_minutes = parsed.data.time_limit_minutes;
  }

  if (parsed.data.status === "revoked") {
    if (current.status !== "pending" && current.status !== "in_progress") {
      return NextResponse.json(
        { error: `No se puede revocar una evaluación en estado "${current.status}".` },
        { status: 409 },
      );
    }
    updates.status = "revoked";
  }

  const { data: updated, error: updateError } = await supabase
    .from("candidate_assessments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (parsed.data.status === "revoked") {
    await logAuditEvent({
      actorId: user.id,
      actorType: "admin",
      action: "assessment_revoked",
      entityType: "candidate_assessment",
      entityId: id,
      metadata: { previous_status: current.status },
    });
  }
  if (parsed.data.time_limit_minutes !== undefined) {
    await logAuditEvent({
      actorId: user.id,
      actorType: "admin",
      action: "assessment_time_limit_updated",
      entityType: "candidate_assessment",
      entityId: id,
      metadata: { previous_minutes: current.time_limit_minutes, new_minutes: parsed.data.time_limit_minutes },
    });
  }

  return NextResponse.json({ candidate_assessment: updated });
}

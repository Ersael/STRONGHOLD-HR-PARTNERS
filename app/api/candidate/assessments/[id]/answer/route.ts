import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeAndPersistScores } from "@/lib/scoring/computeAndPersist";
import { logAuditEvent } from "@/lib/audit/log";
import type { AnswerJson } from "@/types/database";

const answerSchema = z.object({
  question_id: z.string().uuid(),
  answer: z.record(z.string(), z.unknown()),
  current_question_index: z.number().int().min(0).optional(),
});

/**
 * POST /api/candidate/assessments/[id]/answer
 *
 * Guarda una respuesta individual (guardado automático: se llama en cuanto
 * el candidato responde cada pregunta). Delegado a `save_my_response`, que
 * valida `auth.uid()`, el estado 'in_progress' y el vencimiento del tiempo.
 * Si la RPC detecta que la prueba JUSTO venció (`error: 'expired'`),
 * disparamos el scoring parcial aquí mismo antes de responder al cliente.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("save_my_response", {
    p_candidate_assessment_id: id,
    p_question_id: parsed.data.question_id,
    p_answer: parsed.data.answer as unknown as AnswerJson,
    p_current_question_index: parsed.data.current_question_index ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string } | null;

  if (!result || result.error) {
    if (result?.error === "expired") {
      await computeAndPersistScores(id);
      await logAuditEvent({
        actorId: user.id,
        actorType: "system",
        action: "assessment_completed_timeout",
        entityType: "candidate_assessment",
        entityId: id,
      });
    }
    return NextResponse.json(result ?? { error: "unknown" }, { status: 400 });
  }

  return NextResponse.json(result);
}

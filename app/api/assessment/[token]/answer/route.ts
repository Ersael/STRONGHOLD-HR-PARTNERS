import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";
import type { AnswerJson } from "@/types/database";

const answerSchema = z.object({
  candidate_assessment_id: z.string().uuid(),
  question_id: z.string().uuid(),
  answer: z.record(z.string(), z.unknown()),
});

/**
 * POST /api/assessment/[token]/answer
 *
 * Guarda una respuesta individual inmediatamente (para soportar
 * guardar/reanudar). Delegado a la función RPC save_response, que valida
 * el token, el estado de la batería y que la pregunta le pertenezca.
 */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("save_response", {
    p_token: token,
    p_candidate_assessment_id: parsed.data.candidate_assessment_id,
    p_question_id: parsed.data.question_id,
    p_answer: parsed.data.answer as unknown as AnswerJson,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string; ok?: boolean };
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

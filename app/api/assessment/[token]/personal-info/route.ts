import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnonClient } from "@/lib/supabase/server";

const personalInfoSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional().default(""),
});

/**
 * POST /api/assessment/[token]/personal-info
 * Paso 1 del portal del candidato: confirmar/completar nombre y teléfono.
 */
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = personalInfoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const supabase = createAnonClient();
  const { data, error } = await supabase.rpc("update_candidate_personal_info", {
    p_token: token,
    p_full_name: parsed.data.full_name,
    p_phone: parsed.data.phone ?? "",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string };
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

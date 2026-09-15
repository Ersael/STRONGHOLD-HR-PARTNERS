import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fetchDimensionScoresForCandidate } from "@/lib/report/fetchScores";

const compareSchema = z.object({
  candidate_ids: z.array(z.string().uuid()).min(2).max(4),
});

/**
 * POST /api/compare
 * Devuelve los scores por dimensión de 2 a 4 candidatos del admin
 * autenticado, para la vista de comparación lado a lado.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = compareSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from("candidates")
    .select("id, full_name")
    .in("id", parsed.data.candidate_ids);

  if (candidatesError) {
    return NextResponse.json({ error: candidatesError.message }, { status: 500 });
  }

  const results = await Promise.all(
    (candidates ?? []).map(async (c) => ({
      id: c.id,
      full_name: c.full_name,
      scores: await fetchDimensionScoresForCandidate(supabase, c.id),
    })),
  );

  return NextResponse.json({ candidates: results });
}

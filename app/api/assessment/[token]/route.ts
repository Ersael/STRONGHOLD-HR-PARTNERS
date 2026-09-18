import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";

/**
 * GET /api/assessment/[token]
 *
 * Punto de entrada del portal del candidato. Llama a la función RPC
 * get_assessment_by_token (SECURITY DEFINER) usando el cliente anónimo:
 * NUNCA se consultan candidate_assessments/responses directamente desde
 * aquí, evitando así filtrar datos de otros candidatos.
 */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const supabase = createAnonClient();

  const { data, error } = await supabase.rpc("get_assessment_by_token", { p_token: token });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { error?: string } | null;

  if (!result || result.error === "not_found" || result.error === "invalid_token") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateAssessmentToken } from "@/lib/utils/token";
import type { RoleVariantCode } from "@/types/database";

const assignSchema = z.object({
  candidate_id: z.string().uuid(),
  assessment_definition_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos una batería"),
  role_variant: z
    .enum(["sales", "commercial_manager", "director", "consultant", "analyst", "operations", "hr"])
    .nullable()
    .optional(),
  expires_in_days: z.number().int().min(1).max(365).optional(),
});

/**
 * POST /api/assign
 *
 * Asigna una o varias baterías a un candidato en un solo acto. Todas las
 * filas de candidate_assessments creadas en esta llamada comparten el
 * mismo unique_token, de modo que el admin obtiene UN solo link
 * /assessment/[token] que cubre todas las baterías elegidas (ver la
 * decisión de diseño documentada en supabase/schema.sql).
 *
 * Si se incluye la batería 'role_specific', se debe enviar role_variant.
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
  const parsed = assignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { candidate_id, assessment_definition_ids, role_variant, expires_in_days } = parsed.data;

  // Verifica que el candidato pertenezca al admin (RLS ya lo protegería,
  // pero validamos explícito para dar un error claro).
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .select("id")
    .eq("id", candidate_id)
    .single();

  if (candidateError || !candidate) {
    return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
  }

  const { data: definitions, error: defError } = await supabase
    .from("assessment_definitions")
    .select("id, code")
    .in("id", assessment_definition_ids);

  if (defError) {
    return NextResponse.json({ error: defError.message }, { status: 500 });
  }

  const requiresRole = definitions?.some((d) => d.code === "role_specific");
  if (requiresRole && !role_variant) {
    return NextResponse.json(
      { error: "Debes elegir un rol para la batería 'Competencias Específicas del Rol'" },
      { status: 400 },
    );
  }

  const token = generateAssessmentToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (expires_in_days ?? 30));

  const rows = assessment_definition_ids.map((assessmentDefinitionId) => {
    const def = definitions?.find((d) => d.id === assessmentDefinitionId);
    return {
      candidate_id,
      assessment_definition_id: assessmentDefinitionId,
      role_variant: def?.code === "role_specific" ? (role_variant as RoleVariantCode) : null,
      unique_token: token,
      status: "pending" as const,
      expires_at: expiresAt.toISOString(),
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("candidate_assessments")
    .insert(rows)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    token,
    assessment_url: `/assessment/${token}`,
    candidate_assessments: inserted,
  });
}

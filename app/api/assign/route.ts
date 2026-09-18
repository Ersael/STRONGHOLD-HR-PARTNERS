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
  /**
   * Minutos de tiempo límite REAL de examen por batería (Fase B), llave =
   * assessment_definition_id, valor = minutos elegidos en
   * AssignAssessmentForm.tsx (pre-cargados con DEFAULT_TIME_LIMIT_MINUTES,
   * editables por el admin). Si no se manda para alguna batería
   * seleccionada, se usa el default SQL de la columna (30).
   */
  time_limits: z.record(z.string().uuid(), z.number().int().min(5).max(240)).optional(),
});

/**
 * POST /api/assign
 *
 * Asigna una o varias baterías a un candidato en un solo acto.
 *
 * `unique_token` (Fase 1): la columna sigue siendo `not null` en
 * `candidate_assessments`, así que seguimos generando un valor random y
 * guardándolo, pero desde la auditoría de Fase C este token YA NO se
 * expone al admin ni tiene ningún uso funcional real: las 4 funciones RPC
 * del flujo viejo por token (`get_assessment_by_token` y compañía) tienen
 * su `grant execute` revocado en `supabase/migrations_v2_b.sql`, así que
 * ese valor es puramente vestigial (satisface el esquema, nada más).
 *
 * Motivo del cambio: antes de esta auditoría, este endpoint devolvía
 * `assessment_url: /assessment/${token}` y `AssignAssessmentForm.tsx` se
 * lo mostraba al admin como "Link generado" para copiar y enviar al
 * candidato. Ese link era el flujo 100% anónimo (sin login) que
 * auto-iniciaba el cronómetro con solo abrir la página e ignoraba
 * `time_limit_minutes` por completo — exactamente el bug que la Fase A
 * debía corregir, reintroducido por seguir generando/mostrando este link
 * para asignaciones NUEVAS. El candidato ahora SIEMPRE debe usar su login
 * real (`/candidate/login`, credenciales entregadas una sola vez al
 * crearlo, ver CredentialsModal.tsx); no hay ningún link que compartir al
 * asignar una evaluación.
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

  const { candidate_id, assessment_definition_ids, role_variant, expires_in_days, time_limits } = parsed.data;

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
    const requestedMinutes = time_limits?.[assessmentDefinitionId];
    return {
      candidate_id,
      assessment_definition_id: assessmentDefinitionId,
      role_variant: def?.code === "role_specific" ? (role_variant as RoleVariantCode) : null,
      unique_token: token,
      status: "pending" as const,
      expires_at: expiresAt.toISOString(),
      // `time_limit_minutes` es el tiempo REAL de examen (arranca cuando el
      // candidato presiona "Iniciar", ver migrations_v2.sql). Si el admin no
      // mandó un valor explícito para esta batería, se omite y queda el
      // default de la columna (30).
      ...(requestedMinutes ? { time_limit_minutes: requestedMinutes } : {}),
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from("candidate_assessments")
    .insert(rows)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Nota: NO se devuelve `assessment_url`/token al cliente a propósito
  // (ver comentario arriba). El candidato accede exclusivamente vía
  // `/candidate/login` con su sesión real.
  return NextResponse.json({
    candidate_assessments: inserted,
  });
}

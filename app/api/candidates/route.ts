import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/utils/password";
import { logAuditEvent } from "@/lib/audit/log";

const createCandidateSchema = z.object({
  full_name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  phone: z.string().optional().nullable(),
  position_applied: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/candidates - crea un candidato para el admin autenticado.
 *
 * Desde la Fase A (migrations_v2.sql), `candidates.id` referencia
 * `auth.users(id)` (igual que `admins`), porque el candidato ahora inicia
 * sesión con email + password reales en vez de acceder solo por token en
 * la URL. Por eso, antes de insertar en `candidates`, este endpoint crea un
 * usuario real de Supabase Auth (vía Admin API / service role, igual que
 * `scripts/seed-admin.ts` hace para admins) con una contraseña temporal
 * generada al azar, y usa ESE uuid como `id` del candidato.
 *
 * La UI de admin que muestra/copia esta contraseña temporal
 * (`components/admin/CredentialsModal.tsx`, Fase B) consume el campo
 * `temporary_password` de esta respuesta sin ningún cambio aquí.
 * `scripts/seed-test-candidate.ts` sigue sirviendo para crear candidatos de
 * prueba desde la terminal.
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
  const parsed = createCandidateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const temporaryPassword = generateTemporaryPassword();

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: temporaryPassword,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: `No se pudo crear el usuario de acceso del candidato: ${userError?.message ?? "error desconocido"}` },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      id: userData.user.id,
      admin_id: user.id,
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      position_applied: parsed.data.position_applied ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    // El usuario de Auth ya se creó; lo eliminamos para no dejar una cuenta
    // huérfana sin fila correspondiente en `candidates`.
    await admin.auth.admin.deleteUser(userData.user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent({
    actorId: user.id,
    actorType: "admin",
    action: "candidate_created",
    entityType: "candidate",
    entityId: data.id,
    metadata: { email: data.email, full_name: data.full_name },
  });

  return NextResponse.json({ candidate: data, temporary_password: temporaryPassword }, { status: 201 });
}

/**
 * GET /api/candidates - lista los candidatos del admin autenticado, con
 * búsqueda opcional por nombre/email y filtro por puesto.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const position = searchParams.get("position")?.trim();

  let query = supabase.from("candidates").select("*").order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (position) {
    query = query.ilike("position_applied", `%${position}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ candidates: data });
}

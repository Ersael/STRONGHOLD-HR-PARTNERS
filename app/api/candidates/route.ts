import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createCandidateSchema = z.object({
  full_name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  phone: z.string().optional().nullable(),
  position_applied: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/candidates - crea un candidato para el admin autenticado.
 * RLS garantiza que solo se pueda insertar con admin_id = auth.uid()
 * (el insert explícito abajo ya lo fija, y la policy lo re-valida).
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

  const { data, error } = await supabase
    .from("candidates")
    .insert({
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ candidate: data }, { status: 201 });
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

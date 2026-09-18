import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para Server Components / Route Handlers / Server
 * Actions, ligado a la sesión del ADMIN vía cookies. Usa la ANON KEY (las
 * políticas RLS son las que autorizan el acceso real).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Se puede ignorar si se llama desde un Server Component sin
            // posibilidad de escribir cookies (el middleware se encarga de
            // refrescar la sesión en ese caso).
          }
        },
      },
    },
  );
}

/**
 * Cliente "anónimo" puro (sin cookies de sesión), usado por los route
 * handlers públicos de /api/assessment/[token]/* para invocar las
 * funciones RPC como lo haría el candidato sin sesión. No lleva ni
 * necesita autenticación: la seguridad la aplican las funciones RPC
 * (SECURITY DEFINER) validando el token contra la base de datos.
 */
export function createAnonClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op: cliente sin estado de sesión
        },
      },
    },
  );
}

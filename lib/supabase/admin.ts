import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con SERVICE ROLE KEY. Bypassa RLS por completo.
 *
 * SOLO debe usarse en código que corre exclusivamente en el servidor
 * (Route Handlers / Server Actions), nunca importado desde un componente
 * marcado "use client", y nunca se debe enviar esta key al navegador.
 *
 * Uso previsto en esta app: calcular y guardar `scores` después de que una
 * batería se marca como completada, y para el script de seed de admin.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

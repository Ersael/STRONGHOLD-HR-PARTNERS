/**
 * scripts/seed-admin.ts
 *
 * Supabase Auth no permite crear usuarios directamente vía SQL (las
 * contraseñas se manejan con hashing especial de GoTrue). Este script usa
 * la Admin API de Supabase (supabase-js + service role key) para:
 *   1) Crear un usuario de Supabase Auth con email + password.
 *   2) Insertar su fila correspondiente en la tabla `admins`.
 *
 * Uso:
 *   npx tsx scripts/seed-admin.ts "Nombre Admin" admin@empresa.com "unaClaveSegura123" "Mi Empresa"
 *
 * Requiere que .env.local (o variables de entorno del shell) tenga
 * NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas.
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import path from "path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const [name, email, password, organizationName] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error(
      'Uso: npx tsx scripts/seed-admin.ts "Nombre Admin" admin@empresa.com "password" "Nombre Empresa"',
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Configúralas en .env.local.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    console.error("Error creando el usuario de Supabase Auth:", userError?.message);
    process.exit(1);
  }

  const { error: adminError } = await supabase.from("admins").insert({
    id: userData.user.id,
    name,
    email,
    organization_name: organizationName ?? "Mi Empresa",
  });

  if (adminError) {
    console.error("Usuario de Auth creado, pero falló el insert en `admins`:", adminError.message);
    console.error(
      `Puedes insertarlo manualmente en el SQL Editor:\n` +
        `insert into public.admins (id, name, email, organization_name) values ('${userData.user.id}', '${name}', '${email}', '${organizationName ?? "Mi Empresa"}');`,
    );
    process.exit(1);
  }

  console.log("Admin creado exitosamente:");
  console.log(`  id: ${userData.user.id}`);
  console.log(`  email: ${email}`);
  console.log("Ya puedes iniciar sesión en /admin/login con este correo y contraseña.");
}

main();

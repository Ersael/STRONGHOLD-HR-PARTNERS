/**
 * scripts/seed-test-candidate.ts
 *
 * Crea un candidato de PRUEBA con login real (email + password), replicando
 * a mano lo que hará la UI de admin de la Fase B (que todavía no existe) al
 * llamar POST /api/candidates. Útil mientras esa UI no está lista, para
 * poder probar /candidate/login de punta a punta.
 *
 * Igual que scripts/seed-admin.ts, usa la Admin API de Supabase
 * (supabase-js + service role key) porque Supabase Auth no permite crear
 * usuarios (con password ya hasheado) directamente por SQL:
 *   1) Busca el admin dueño por su email (debe existir ya, ver
 *      scripts/seed-admin.ts).
 *   2) Crea un usuario de Supabase Auth para el candidato, con una
 *      contraseña temporal generada al azar (o la que pases como último
 *      argumento opcional).
 *   3) Inserta su fila en `public.candidates` con `id` = uuid del usuario
 *      recién creado (requisito del esquema desde
 *      supabase/migrations_v2.sql: candidates.id referencia auth.users(id)).
 *
 * Uso:
 *   npx tsx scripts/seed-test-candidate.ts \
 *     "Nombre Candidato" candidato@example.com admin@tuempresa.com \
 *     ["Puesto aplicado"] ["contraseñaOpcional"]
 *
 * Requiere que .env.local (o variables de entorno del shell) tenga
 * NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas.
 *
 * NOTA: este script NO asigna ninguna batería al candidato (eso sigue
 * haciéndose desde /admin/candidates/[id] -> "Asignar evaluación", que ya
 * funciona sin cambios porque solo depende de `candidate_id`, no del
 * mecanismo de login). Sin al menos una batería asignada, el candidato
 * verá su dashboard en /candidate vacío.
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import path from "path";
import { generateTemporaryPassword } from "../lib/utils/password";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const [fullName, email, adminEmail, positionApplied, passwordArg] = process.argv.slice(2);

  if (!fullName || !email || !adminEmail) {
    console.error(
      'Uso: npx tsx scripts/seed-test-candidate.ts "Nombre Candidato" candidato@example.com admin@tuempresa.com ["Puesto aplicado"] ["contraseñaOpcional"]',
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

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id, name")
    .eq("email", adminEmail)
    .maybeSingle();

  if (adminError) {
    console.error("Error buscando al admin:", adminError.message);
    process.exit(1);
  }

  if (!admin) {
    console.error(
      `No existe ningún admin con el correo "${adminEmail}". Créalo primero con npm run seed:admin.`,
    );
    process.exit(1);
  }

  const password = passwordArg ?? generateTemporaryPassword();

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    console.error("Error creando el usuario de Supabase Auth del candidato:", userError?.message);
    process.exit(1);
  }

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .insert({
      id: userData.user.id,
      admin_id: admin.id,
      full_name: fullName,
      email,
      position_applied: positionApplied ?? null,
    })
    .select()
    .single();

  if (candidateError) {
    console.error("Usuario de Auth creado, pero falló el insert en `candidates`:", candidateError.message);
    console.error(
      `Puedes insertarlo manualmente en el SQL Editor (recuerda que el esquema NO tiene default para id):\n` +
        `insert into public.candidates (id, admin_id, full_name, email, position_applied) values ` +
        `('${userData.user.id}', '${admin.id}', '${fullName}', '${email}', ${positionApplied ? `'${positionApplied}'` : "null"});`,
    );
    // Limpieza: evita dejar un usuario de Auth huérfano sin fila en candidates.
    await supabase.auth.admin.deleteUser(userData.user.id);
    process.exit(1);
  }

  console.log("Candidato de prueba creado exitosamente:");
  console.log(`  id: ${candidate.id}`);
  console.log(`  admin dueño: ${admin.name} (${adminEmail})`);
  console.log(`  email: ${email}`);
  console.log(`  password temporal: ${password}`);
  console.log("");
  console.log("Ya puede iniciar sesión en /candidate/login con ese correo y contraseña.");
  console.log(
    "Todavía no tiene ninguna batería asignada: entra como admin a " +
      `/admin/candidates/${candidate.id} y usa \"Asignar evaluación\" para asignarle al menos una.`,
  );
}

main();

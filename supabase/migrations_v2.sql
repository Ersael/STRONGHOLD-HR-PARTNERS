-- ============================================================================
-- MIGRACIÓN V2 — FASE A: LOGIN REAL DE CANDIDATOS + MOTOR DE TIEMPO
-- ============================================================================
-- Este archivo es una EXTENSIÓN de supabase/schema.sql, no un reemplazo.
-- schema.sql ya debe estar aplicado (7 assessment_definitions, questions,
-- candidate_assessments, etc.) antes de correr esto.
--
-- IMPORTANTE — ESTE ARCHIVO SE DEBE EJECUTAR EN **DOS PASADAS SEPARADAS**
-- EN EL SQL EDITOR DE SUPABASE, NO DE UN SOLO "RUN":
--
--   PASADA 1 -> copia y ejecuta SOLO el bloque delimitado como
--               "===== PASADA 1 =====" más abajo. Espera a que termine.
--   PASADA 2 -> copia y ejecuta TODO el resto del archivo (desde
--               "===== PASADA 2 =====" hasta el final).
--
-- ¿Por qué? Postgres corre todas las sentencias de un mismo "Run" del SQL
-- Editor dentro de una única transacción implícita (el protocolo simple de
-- consultas envuelve todo el batch en un solo bloque de transacción salvo
-- que el propio script tenga BEGIN/COMMIT explícitos). `ALTER TYPE ... ADD
-- VALUE` no puede usarse y luego LEERSE/COMPARARSE (p.ej. en un `where
-- status = 'expired'`) dentro de esa misma transacción: Postgres lanza el
-- error "unsafe use of new value of enum type" porque el nuevo valor del
-- enum todavía no está "comprometido" (committed) para el resto de la
-- transacción. Ejecutar la Pasada 1 sola, dejar que el Run termine (eso
-- hace commit), y luego correr la Pasada 2 en un Run aparte evita el error.
-- ============================================================================


-- ============================================================================
-- ===== PASADA 1 ===== (ejecutar sola, esperar a que el Run termine, luego
-- continuar con la Pasada 2 en un Run/consulta NUEVA)
-- ============================================================================
alter type assessment_status add value if not exists 'expired';
alter type assessment_status add value if not exists 'revoked';
-- ============================================================================
-- ===== FIN PASADA 1 =====
-- ============================================================================


-- ============================================================================
-- ===== PASADA 2 ===== (ejecutar TODO lo siguiente en un Run NUEVO, después
-- de que la Pasada 1 haya terminado y hecho commit)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ⚠️  AVISO DESTRUCTIVO — LEE ANTES DE EJECUTAR EN UNA BASE CON DATOS REALES
-- ----------------------------------------------------------------------------
-- Esta migración cambia `public.candidates.id` para que sea un
-- `uuid primary key references auth.users(id)`, igual que `public.admins`,
-- en vez de un uuid libre generado por la aplicación
-- (`default gen_random_uuid()`). Esto es indispensable para dar a cada
-- candidato un login real (email + password) contra Supabase Auth.
--
-- Los candidatos que existan HOY en `public.candidates` fueron creados con
-- un uuid propio que NO corresponde a ninguna fila de `auth.users` (el
-- flujo viejo era 100% anónimo por token, sin Auth). Es IMPOSIBLE preservar
-- esas filas bajo el nuevo esquema sin antes crearles un usuario real de
-- Auth con ese mismo uuid (Supabase Auth no permite elegir el uuid al crear
-- un usuario vía Admin API, así que ni siquiera eso es directamente
-- viable).
--
-- Por eso este script BORRA (TRUNCATE ... CASCADE) todos los candidatos
-- existentes y, en cascada, sus candidate_assessments, responses, scores y
-- reports asociados. Esto es aceptable en este momento porque, según el
-- contexto de este proyecto, solo hay datos de candidatos DE PRUEBA (no hay
-- candidatos reales de producción todavía) — el admin real y su cuenta de
-- Supabase Auth (tabla `admins`) NO se tocan ni se borran.
--
-- SI PARA CUANDO CORRES ESTO YA EXISTEN CANDIDATOS REALES QUE NECESITAS
-- CONSERVAR: DETENTE AQUÍ. Exporta manualmente sus datos (candidates,
-- candidate_assessments, responses, scores, reports) antes de continuar, y
-- luego re-crea cada candidato con `scripts/seed-test-candidate.ts` (o un
-- script equivalente que llame a `supabase.auth.admin.createUser` con el
-- mismo email) para obtener un uuid de `auth.users` y reinsertar sus datos
-- históricos apuntando al uuid nuevo.
-- ----------------------------------------------------------------------------
truncate table
  public.reports,
  public.scores,
  public.responses,
  public.candidate_assessments,
  public.candidates
cascade;

-- Quita el default de auto-generación: a partir de ahora el id de un
-- candidato SIEMPRE debe ser el uuid de su usuario de auth.users (lo fija
-- la aplicación al crear el candidato, ver scripts/seed-test-candidate.ts).
alter table public.candidates alter column id drop default;

-- Convierte el id en referencia a auth.users, igual que admins.id.
alter table public.candidates
  add constraint candidates_id_fkey foreign key (id) references auth.users (id) on delete cascade;

-- ----------------------------------------------------------------------------
-- RLS: permite que un candidato autenticado lea SU PROPIA fila en
-- `candidates` (necesario para que el middleware pueda confirmar "auth.uid()
-- corresponde a un candidato" y para que el dashboard pueda mostrar su
-- nombre). Esto convive con la policy `candidates_owner` ya existente
-- (el admin dueño sigue viendo/editando todos sus candidatos); las policies
-- permisivas de Postgres se combinan con OR, así que ambas coexisten sin
-- conflicto. El candidato NO puede editar su propia fila por esta vía (la
-- policy es solo `for select`), solo leerla.
-- ----------------------------------------------------------------------------
drop policy if exists candidates_self_read on public.candidates;
create policy candidates_self_read on public.candidates
  for select
  to authenticated
  using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- Columnas nuevas en candidate_assessments:
--  - time_limit_minutes: minutos de tiempo real de examen para ESA batería
--    (antes no existía límite de tiempo real, solo `expires_at` como fecha
--    de validez del link a 30 días). Default 30 razonable para que la Fase
--    B tenga algo sensato que mostrar/editar en su configurador de tiempos
--    por batería.
--  - current_question_index: permite reanudar exactamente en la pregunta
--    donde el candidato se quedó (antes se recalculaba "la siguiente sin
--    responder" en cada carga, lo cual sigue funcionando como respaldo,
--    pero esta columna evita recomputar y es más explícita).
--  - completed_by_timeout: true cuando una batería pasó a 'expired' porque
--    se acabó el tiempo, en vez de que el candidato la completara a mano.
--    Útil para que el admin (Fase B) distinga "completó" de "se le acabó
--    el tiempo" en el listado.
-- ----------------------------------------------------------------------------
alter table public.candidate_assessments
  add column if not exists time_limit_minutes integer not null default 30,
  add column if not exists current_question_index integer not null default 0,
  add column if not exists completed_by_timeout boolean not null default false;

create index if not exists idx_candidate_assessments_candidate_status
  on public.candidate_assessments (candidate_id, status);

-- ============================================================================
-- RPC FUNCTIONS NUEVAS (SECURITY DEFINER) — flujo de candidato AUTENTICADO
-- por sesión (auth.uid()), en reemplazo del flujo por unique_token para
-- todo código NUEVO. Las funciones viejas (get_assessment_by_token,
-- save_response, update_candidate_personal_info,
-- complete_candidate_assessment) NO se tocan ni se eliminan: quedan
-- intactas en supabase/schema.sql por compatibilidad con cualquier link ya
-- compartido, pero el portal nuevo (/candidate/*) nunca las usa.
--
-- DISEÑO DE EXPIRACIÓN POR TIEMPO (léase con atención):
-- No hay infraestructura de cron/jobs en este proyecto (Supabase free tier /
-- despliegue simple). La expiración por tiempo se resuelve de forma
-- PEREZOSA (lazy): cada función de abajo que lee o escribe sobre una
-- candidate_assessment en estado 'in_progress' compara primero `now()`
-- contra `expires_at`. Si ya venció, la deja en 'expired' con
-- `completed_at = now()` y `completed_by_timeout = true`, y a partir de ahí
-- rechaza cualquier intento de seguir respondiendo. Esto NO es un bug ni un
-- descuido: es la estrategia deliberada para no depender de un worker en
-- background. La consecuencia es que una batería "vencida" técnicamente
-- sigue en 'in_progress' en la fila hasta que ALGO (el candidato reabriendo
-- la pantalla, guardando una respuesta, o el admin viendo el listado, en
-- Fase B) dispara una de estas funciones. En la práctica esto pasa casi de
-- inmediato porque el cliente llama a estos endpoints apenas el
-- cronómetro llega a 00:00 (ver components/candidate/*).
--
-- El cálculo de `scores` en sí (lib/scoring, en TypeScript) NO vive en SQL:
-- estas funciones solo dejan el estado en 'expired'/'completed'. La capa de
-- aplicación (app/api/candidate/assessments/[id]/route.ts y
-- .../complete/route.ts) es la que detecta "esto se acaba de vencer/
-- completar ahora mismo" y dispara `computeAndPersistScores` (
-- lib/scoring/computeAndPersist.ts), reutilizando exactamente la misma
-- lógica que ya usaba el flujo viejo por token en
-- app/api/assessment/[token]/complete/route.ts.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- get_my_assessments: dashboard del candidato. Devuelve TODAS sus
-- candidate_assessments (cada una ya es independiente; ya no existe el
-- concepto de "token compartido" para este flujo), con conteos de
-- preguntas totales/respondidas para la barra de progreso. NO incluye
-- preguntas ni respuestas (eso es get_assessment_detail).
--
-- `just_expired_ids` (auditoría v2 Fase C): esta función TAMBIÉN dispara la
-- expiración perezosa (igual que get_assessment_detail/save_my_response/
-- complete_my_assessment), porque el candidato puede dejar el cronómetro
-- llegar a 00:00 sin volver a abrir la pantalla de examen — si solo
-- recarga el dashboard, ESTE es el único punto que toca esa fila después
-- de vencida. Antes, esta función marcaba la fila como 'expired' pero no
-- avisaba a la capa de aplicación cuáles ids cambiaron en esta llamada, así
-- que `app/api/candidate/assessments/route.ts` nunca disparaba
-- `computeAndPersistScores` para ellas: la batería quedaba 'expired' para
-- siempre SIN scores calculados si el candidato nunca más volvía a abrir
-- esa evaluación en particular. `just_expired_ids` devuelve exactamente los
-- ids que esta llamada acaba de expirar, para que la capa de aplicación
-- pueda calcular su scoring parcial de inmediato (ver el route handler).
-- ----------------------------------------------------------------------------
create or replace function public.get_my_assessments()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid := auth.uid();
  v_candidate jsonb;
  v_assessments jsonb;
  v_just_expired_ids jsonb;
begin
  if v_candidate_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  if not exists (select 1 from public.candidates where id = v_candidate_id) then
    return jsonb_build_object('error', 'not_a_candidate');
  end if;

  -- Expiración perezosa de cualquier batería in_progress ya vencida (ver
  -- nota de diseño arriba) antes de reportar el estado al dashboard. Se
  -- capturan los ids afectados en esta misma sentencia (`returning`) para
  -- poder disparar el scoring parcial desde la capa de aplicación.
  with expired as (
    update public.candidate_assessments
    set status = 'expired', completed_at = now(), completed_by_timeout = true
    where candidate_id = v_candidate_id
      and status = 'in_progress'
      and expires_at < now()
    returning id
  )
  select coalesce(jsonb_agg(id), '[]'::jsonb) into v_just_expired_ids from expired;

  select to_jsonb(c) - 'admin_id' - 'notes' into v_candidate
  from public.candidates c
  where c.id = v_candidate_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ca.id,
      'assessment_definition_id', ca.assessment_definition_id,
      'assessment_code', ad.code,
      'assessment_name', ad.name,
      'assessment_description', ad.description,
      'role_variant', ca.role_variant,
      'status', ca.status,
      'time_limit_minutes', ca.time_limit_minutes,
      'started_at', ca.started_at,
      'expires_at', ca.expires_at,
      'completed_at', ca.completed_at,
      'completed_by_timeout', ca.completed_by_timeout,
      'current_question_index', ca.current_question_index,
      'total_questions', (
        select count(*) from public.questions q
        where q.assessment_definition_id = ca.assessment_definition_id
          and (q.role_variant is not distinct from ca.role_variant)
      ),
      'answered_questions', (
        select count(distinct r.question_id) from public.responses r
        where r.candidate_assessment_id = ca.id
      )
    ) order by ca.created_at
  ), '[]'::jsonb) into v_assessments
  from public.candidate_assessments ca
  join public.assessment_definitions ad on ad.id = ca.assessment_definition_id
  where ca.candidate_id = v_candidate_id;

  return jsonb_build_object(
    'ok', true,
    'server_time', now(),
    'candidate', v_candidate,
    'assessments', v_assessments,
    'just_expired_ids', v_just_expired_ids
  );
end;
$$;

grant execute on function public.get_my_assessments() to authenticated;

-- ----------------------------------------------------------------------------
-- start_candidate_assessment: el candidato presiona "INICIAR" en la
-- pantalla previa de una batería 'pending'. Este es el único punto donde
-- arranca el cronómetro real: calcula expires_at = now() + time_limit_minutes
-- y pasa a 'in_progress'. Si ya está in_progress o completed/expired, NO
-- reinicia nada (a diferencia del viejo get_assessment_by_token, que
-- auto-arrancaba el cronómetro con solo cargar la página).
-- ----------------------------------------------------------------------------
create or replace function public.start_candidate_assessment(p_candidate_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid := auth.uid();
  v_ca record;
  v_expires_at timestamptz;
begin
  if v_candidate_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_ca
  from public.candidate_assessments
  where id = p_candidate_assessment_id and candidate_id = v_candidate_id
  for update;

  if v_ca is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_ca.status = 'in_progress' then
    return jsonb_build_object(
      'error', 'already_in_progress',
      'started_at', v_ca.started_at,
      'expires_at', v_ca.expires_at,
      'server_time', now()
    );
  end if;

  if v_ca.status in ('completed', 'expired', 'revoked') then
    return jsonb_build_object('error', 'not_pending', 'status', v_ca.status);
  end if;

  v_expires_at := now() + (v_ca.time_limit_minutes || ' minutes')::interval;

  update public.candidate_assessments
  set status = 'in_progress',
      started_at = now(),
      expires_at = v_expires_at,
      current_question_index = 0
  where id = v_ca.id;

  return jsonb_build_object(
    'ok', true,
    'started_at', now(),
    'expires_at', v_expires_at,
    'server_time', now()
  );
end;
$$;

grant execute on function public.start_candidate_assessment(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- get_assessment_detail: pantalla de examen. Antes de devolver nada,
-- revisa si la batería está 'in_progress' y ya venció; si es así, dispara
-- la expiración (deja 'expired'/completed_at/completed_by_timeout) y
-- devuelve `just_expired: true` para que la capa de aplicación sepa que
-- debe calcular el scoring parcial en ese mismo request. Nunca incluye
-- `correct_index` en las preguntas.
-- ----------------------------------------------------------------------------
create or replace function public.get_assessment_detail(p_candidate_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid := auth.uid();
  v_ca record;
  v_ad record;
  v_questions jsonb;
  v_responses jsonb;
  v_just_expired boolean := false;
begin
  if v_candidate_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_ca
  from public.candidate_assessments
  where id = p_candidate_assessment_id and candidate_id = v_candidate_id
  for update;

  if v_ca is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  select ad.name, ad.description, ad.code into v_ad
  from public.assessment_definitions ad
  where ad.id = v_ca.assessment_definition_id;

  if v_ca.status = 'in_progress' and v_ca.expires_at < now() then
    update public.candidate_assessments
    set status = 'expired', completed_at = now(), completed_by_timeout = true
    where id = v_ca.id
    returning * into v_ca;
    v_just_expired := true;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'order_index', q.order_index,
      'question_type', q.question_type,
      'dimension', q.dimension,
      'prompt_text', q.prompt_text,
      -- nunca se expone correct_index al candidato
      'options_json', (q.options_json - 'correct_index'),
      'is_reverse_scored', q.is_reverse_scored
    ) order by q.order_index
  ), '[]'::jsonb) into v_questions
  from public.questions q
  where q.assessment_definition_id = v_ca.assessment_definition_id
    and (q.role_variant is not distinct from v_ca.role_variant);

  select coalesce(jsonb_agg(
    jsonb_build_object('question_id', r.question_id, 'answer_json', r.answer_json)
  ), '[]'::jsonb) into v_responses
  from public.responses r
  where r.candidate_assessment_id = v_ca.id;

  return jsonb_build_object(
    'ok', true,
    'server_time', now(),
    'just_expired', v_just_expired,
    'assessment', jsonb_build_object(
      'id', v_ca.id,
      'assessment_definition_id', v_ca.assessment_definition_id,
      'assessment_code', v_ad.code,
      'assessment_name', v_ad.name,
      'assessment_description', v_ad.description,
      'role_variant', v_ca.role_variant,
      'status', v_ca.status,
      'time_limit_minutes', v_ca.time_limit_minutes,
      'started_at', v_ca.started_at,
      'expires_at', v_ca.expires_at,
      'completed_at', v_ca.completed_at,
      'completed_by_timeout', v_ca.completed_by_timeout,
      'current_question_index', v_ca.current_question_index,
      'questions', v_questions,
      'responses', v_responses
    )
  );
end;
$$;

grant execute on function public.get_assessment_detail(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- save_my_response: guarda/actualiza una respuesta y, opcionalmente,
-- `current_question_index` para poder reanudar exacto. Rechaza si la
-- batería no está 'in_progress'; si detecta que justo venció, dispara la
-- expiración y devuelve error 'expired' (la capa de aplicación calcula el
-- scoring parcial en ese caso).
-- ----------------------------------------------------------------------------
create or replace function public.save_my_response(
  p_candidate_assessment_id uuid,
  p_question_id uuid,
  p_answer jsonb,
  p_current_question_index integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid := auth.uid();
  v_ca record;
  v_question_exists boolean;
begin
  if v_candidate_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_ca
  from public.candidate_assessments
  where id = p_candidate_assessment_id and candidate_id = v_candidate_id
  for update;

  if v_ca is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_ca.status = 'in_progress' and v_ca.expires_at < now() then
    update public.candidate_assessments
    set status = 'expired', completed_at = now(), completed_by_timeout = true
    where id = v_ca.id;
    return jsonb_build_object('error', 'expired');
  end if;

  if v_ca.status != 'in_progress' then
    return jsonb_build_object('error', 'not_in_progress', 'status', v_ca.status);
  end if;

  select exists (
    select 1 from public.questions q
    where q.id = p_question_id
      and q.assessment_definition_id = v_ca.assessment_definition_id
      and (q.role_variant is not distinct from v_ca.role_variant)
  ) into v_question_exists;

  if not v_question_exists then
    return jsonb_build_object('error', 'question_mismatch');
  end if;

  insert into public.responses (candidate_assessment_id, question_id, answer_json, answered_at)
  values (p_candidate_assessment_id, p_question_id, p_answer, now())
  on conflict (candidate_assessment_id, question_id)
  do update set answer_json = excluded.answer_json, answered_at = now();

  if p_current_question_index is not null then
    update public.candidate_assessments
    set current_question_index = p_current_question_index
    where id = v_ca.id;
  end if;

  return jsonb_build_object('ok', true, 'server_time', now());
end;
$$;

grant execute on function public.save_my_response(uuid, uuid, jsonb, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- complete_my_assessment: como complete_candidate_assessment, pero por
-- auth.uid() en vez de token. Si detecta que justo venció, expira en vez de
-- completar y devuelve 'expired' (la app calcula scoring parcial igual).
-- ----------------------------------------------------------------------------
create or replace function public.complete_my_assessment(p_candidate_assessment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid := auth.uid();
  v_ca record;
  v_total_questions integer;
  v_answered integer;
begin
  if v_candidate_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_ca
  from public.candidate_assessments
  where id = p_candidate_assessment_id and candidate_id = v_candidate_id
  for update;

  if v_ca is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_ca.status = 'completed' then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  if v_ca.status = 'in_progress' and v_ca.expires_at < now() then
    update public.candidate_assessments
    set status = 'expired', completed_at = now(), completed_by_timeout = true
    where id = v_ca.id;
    return jsonb_build_object('error', 'expired');
  end if;

  if v_ca.status != 'in_progress' then
    return jsonb_build_object('error', 'not_in_progress', 'status', v_ca.status);
  end if;

  select count(*) into v_total_questions
  from public.questions q
  where q.assessment_definition_id = v_ca.assessment_definition_id
    and (q.role_variant is not distinct from v_ca.role_variant);

  select count(distinct r.question_id) into v_answered
  from public.responses r
  where r.candidate_assessment_id = v_ca.id;

  if v_total_questions = 0 or v_answered < v_total_questions then
    return jsonb_build_object('error', 'incomplete', 'answered', v_answered, 'total', v_total_questions);
  end if;

  update public.candidate_assessments
  set status = 'completed', completed_at = now()
  where id = v_ca.id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.complete_my_assessment(uuid) to authenticated;

-- ============================================================================
-- FIN migrations_v2.sql (Fase A)
-- ============================================================================

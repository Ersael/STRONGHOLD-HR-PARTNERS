-- ============================================================================
-- PLATAFORMA DE EVALUACION PSICOMETRICA - ESQUEMA SUPABASE (FASE 1)
-- ============================================================================
-- Ejecutar completo en el SQL Editor de Supabase (proyecto nuevo, vacio).
-- Este script es idempotente en la medida de lo posible (usa IF NOT EXISTS /
-- ON CONFLICT) para poder re-ejecutarse durante desarrollo.
--
-- AVISO ETICO DEL PRODUCTO (ver tambien lib/constants.ts y el pie del PDF):
-- Los items y baremos de esta plataforma son ILUSTRATIVOS. No existe un
-- estudio de confiabilidad/validez ni normas poblacionales reales detras.
-- No deben ser el unico criterio de una decision de contratacion.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid(), gen_random_bytes()

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type assessment_code as enum (
    'behavioral', 'cognitive', 'personality', 'competencies',
    'values', 'leadership', 'role_specific'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type role_variant_code as enum (
    'sales', 'commercial_manager', 'director', 'consultant',
    'analyst', 'operations', 'hr'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_type as enum ('forced_choice_quad', 'likert5', 'multiple_choice');
exception when duplicate_object then null; end $$;

do $$ begin
  create type assessment_status as enum ('pending', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- TABLA: admins
-- Un admin = un usuario de Supabase Auth (auth.users). 1:1 vía id compartido.
-- ----------------------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  organization_name text not null default 'Mi Empresa',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLA: candidates
-- ----------------------------------------------------------------------------
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  position_applied text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_candidates_admin_id on public.candidates (admin_id);
create index if not exists idx_candidates_email on public.candidates (email);
create index if not exists idx_candidates_position on public.candidates (position_applied);

-- ----------------------------------------------------------------------------
-- TABLA: assessment_definitions
-- Las 7 baterías fijas. config_json guarda dimensiones, tipo de pregunta
-- dominante y (para role_specific) las variantes de rol disponibles.
-- ----------------------------------------------------------------------------
create table if not exists public.assessment_definitions (
  id uuid primary key default gen_random_uuid(),
  code assessment_code not null unique,
  name text not null,
  description text not null,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLA: questions
-- role_variant solo aplica quando assessment_definition.code = 'role_specific'.
-- options_json cambia de forma según question_type (ver lib/scoring y
-- types/database.ts para los shapes exactos). is_reverse_scored solo se usa
-- en likert5.
-- ----------------------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_definition_id uuid not null references public.assessment_definitions (id) on delete cascade,
  role_variant role_variant_code,
  order_index integer not null default 0,
  question_type question_type not null,
  dimension text not null,
  prompt_text text not null,
  options_json jsonb not null default '{}'::jsonb,
  is_reverse_scored boolean not null default false,
  created_at timestamptz not null default now(),
  constraint chk_role_variant_only_role_specific check (
    role_variant is null or true -- validado a nivel de aplicación contra assessment_definitions.code = 'role_specific'
  )
);

create index if not exists idx_questions_assessment_def on public.questions (assessment_definition_id);
create index if not exists idx_questions_role_variant on public.questions (role_variant);
create index if not exists idx_questions_order on public.questions (assessment_definition_id, role_variant, order_index);

-- ----------------------------------------------------------------------------
-- TABLA: candidate_assessments
--
-- DECISION DE DISEÑO IMPORTANTE sobre unique_token:
-- El flujo de negocio pide "un link" al asignar una o varias baterías a la
-- vez. Para lograr un solo link cubriendo varias baterías sin romper el
-- modelo 1 fila = 1 batería, las filas creadas en un mismo acto de
-- asignación COMPARTEN el mismo unique_token. Por eso el token está
-- INDEXADO pero no es UNIQUE a nivel de columna (la unicidad real es del
-- "lote de asignación", no de la fila). La colisión entre lotes es
-- prácticamente imposible porque el token se genera con 32 bytes
-- aleatorios codificados en base64url (ver lib/utils/token.ts).
-- ----------------------------------------------------------------------------
create table if not exists public.candidate_assessments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  assessment_definition_id uuid not null references public.assessment_definitions (id) on delete cascade,
  role_variant role_variant_code,
  unique_token text not null,
  status assessment_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  unique (candidate_id, assessment_definition_id, role_variant)
);

create index if not exists idx_candidate_assessments_candidate on public.candidate_assessments (candidate_id);
create index if not exists idx_candidate_assessments_token on public.candidate_assessments (unique_token);
create index if not exists idx_candidate_assessments_def on public.candidate_assessments (assessment_definition_id);
create index if not exists idx_candidate_assessments_status on public.candidate_assessments (status);

-- ----------------------------------------------------------------------------
-- TABLA: responses
-- Una fila por pregunta respondida -> permite guardar/reanudar.
-- ----------------------------------------------------------------------------
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  candidate_assessment_id uuid not null references public.candidate_assessments (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  answer_json jsonb not null,
  answered_at timestamptz not null default now(),
  unique (candidate_assessment_id, question_id)
);

create index if not exists idx_responses_candidate_assessment on public.responses (candidate_assessment_id);
create index if not exists idx_responses_question on public.responses (question_id);

-- ----------------------------------------------------------------------------
-- TABLA: scores
-- Un resultado por dimensión por candidate_assessment.
-- ----------------------------------------------------------------------------
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  candidate_assessment_id uuid not null references public.candidate_assessments (id) on delete cascade,
  dimension text not null,
  raw_score numeric not null,
  normalized_score numeric not null,
  percentile numeric not null,
  created_at timestamptz not null default now(),
  unique (candidate_assessment_id, dimension)
);

create index if not exists idx_scores_candidate_assessment on public.scores (candidate_assessment_id);
create index if not exists idx_scores_dimension on public.scores (dimension);

-- ----------------------------------------------------------------------------
-- TABLA: reports
-- report_json contiene las 12 secciones generadas por reglas.
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  generated_at timestamptz not null default now(),
  report_json jsonb not null,
  pdf_url text
);

create index if not exists idx_reports_candidate on public.reports (candidate_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.admins enable row level security;
alter table public.candidates enable row level security;
alter table public.assessment_definitions enable row level security;
alter table public.questions enable row level security;
alter table public.candidate_assessments enable row level security;
alter table public.responses enable row level security;
alter table public.scores enable row level security;
alter table public.reports enable row level security;

-- admins: cada admin solo ve/edita su propia fila
drop policy if exists admins_self on public.admins;
create policy admins_self on public.admins
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- candidates: solo el admin dueño
drop policy if exists candidates_owner on public.candidates;
create policy candidates_owner on public.candidates
  for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- assessment_definitions y questions: catálogo de solo lectura para admins
-- autenticados. El acceso de candidatos (anon) pasa exclusivamente por las
-- funciones RPC de más abajo (SECURITY DEFINER), nunca por estas tablas.
drop policy if exists assessment_definitions_read on public.assessment_definitions;
create policy assessment_definitions_read on public.assessment_definitions
  for select
  to authenticated
  using (true);

drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions
  for select
  to authenticated
  using (true);

-- candidate_assessments: solo el admin dueño del candidato asociado.
-- NO hay policy para "anon" -> el candidato jamás toca esta tabla directo.
drop policy if exists candidate_assessments_owner on public.candidate_assessments;
create policy candidate_assessments_owner on public.candidate_assessments
  for all
  to authenticated
  using (
    exists (
      select 1 from public.candidates c
      where c.id = candidate_assessments.candidate_id and c.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.candidates c
      where c.id = candidate_assessments.candidate_id and c.admin_id = auth.uid()
    )
  );

-- responses: solo el admin dueño (vía candidate_assessments -> candidates).
-- El candidato escribe respuestas exclusivamente vía la función RPC
-- save_response(), nunca contra esta tabla.
drop policy if exists responses_owner on public.responses;
create policy responses_owner on public.responses
  for all
  to authenticated
  using (
    exists (
      select 1 from public.candidate_assessments ca
      join public.candidates c on c.id = ca.candidate_id
      where ca.id = responses.candidate_assessment_id and c.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.candidate_assessments ca
      join public.candidates c on c.id = ca.candidate_id
      where ca.id = responses.candidate_assessment_id and c.admin_id = auth.uid()
    )
  );

-- scores: solo el admin dueño
drop policy if exists scores_owner on public.scores;
create policy scores_owner on public.scores
  for all
  to authenticated
  using (
    exists (
      select 1 from public.candidate_assessments ca
      join public.candidates c on c.id = ca.candidate_id
      where ca.id = scores.candidate_assessment_id and c.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.candidate_assessments ca
      join public.candidates c on c.id = ca.candidate_id
      where ca.id = scores.candidate_assessment_id and c.admin_id = auth.uid()
    )
  );

-- reports: solo el admin dueño
drop policy if exists reports_owner on public.reports;
create policy reports_owner on public.reports
  for all
  to authenticated
  using (
    exists (
      select 1 from public.candidates c
      where c.id = reports.candidate_id and c.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.candidates c
      where c.id = reports.candidate_id and c.admin_id = auth.uid()
    )
  );

-- ============================================================================
-- RPC FUNCTIONS (SECURITY DEFINER) - único punto de acceso para candidatos
-- anónimos. El anon key NUNCA debe tener policies directas sobre
-- candidate_assessments/responses; todo pasa por aquí, filtrado por token.
--
-- NOTA (auditoría v2 Fase C): las 4 funciones de este bloque implementan el
-- flujo 100% anónimo por `unique_token` de la Fase 1. Ese flujo quedó
-- retirado a partir de `supabase/migrations_v2_b.sql`, que revoca (`revoke
-- execute ... from anon, authenticated`) el `grant execute` que cada
-- función abajo todavía declara, porque desde `migrations_v2.sql` (Fase A)
-- TODO candidato requiere login real y ya no existe ningún caso de uso
-- legítimo para acceso sin sesión. Las funciones se dejan aquí sin borrar
-- (referencia histórica / no romper el orden de ejecución de los 3
-- archivos), pero después de aplicar los 3 scripts en orden quedan
-- inertes. Ver el comentario extenso en migrations_v2_b.sql para el detalle
-- de qué bug concreto motivó cerrarlas del todo (no solo dejar de usarlas
-- desde el frontend nuevo).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- get_assessment_by_token: entrega todo lo necesario para renderizar el
-- portal del candidato (datos del candidato, baterías asignadas bajo ese
-- token, sus preguntas -sin respuestas correctas- y las respuestas ya
-- guardadas para poder reanudar). Efecto lateral: si una batería está
-- 'pending' y no ha expirado, la pasa a 'in_progress'.
-- ----------------------------------------------------------------------------
create or replace function public.get_assessment_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid;
  v_candidate jsonb;
  v_assessments jsonb;
begin
  if p_token is null or length(p_token) < 10 then
    return jsonb_build_object('error', 'invalid_token');
  end if;

  select candidate_id into v_candidate_id
  from public.candidate_assessments
  where unique_token = p_token
  limit 1;

  if v_candidate_id is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- Pasar de pending a in_progress las que corresponda (solo si no expiraron)
  update public.candidate_assessments
  set status = 'in_progress', started_at = now()
  where unique_token = p_token
    and status = 'pending'
    and expires_at > now();

  select to_jsonb(c) - 'admin_id' - 'notes' into v_candidate
  from public.candidates c
  where c.id = v_candidate_id;

  select jsonb_agg(
    jsonb_build_object(
      'id', ca.id,
      'assessment_definition_id', ca.assessment_definition_id,
      'assessment_code', ad.code,
      'assessment_name', ad.name,
      'config_json', ad.config_json,
      'role_variant', ca.role_variant,
      'status', ca.status,
      'expires_at', ca.expires_at,
      'started_at', ca.started_at,
      'completed_at', ca.completed_at,
      'questions', (
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'id', q.id,
            'order_index', q.order_index,
            'question_type', q.question_type,
            'dimension', q.dimension,
            'prompt_text', q.prompt_text,
            -- se elimina correct_index para no filtrar la respuesta correcta
            'options_json', (q.options_json - 'correct_index'),
            'is_reverse_scored', q.is_reverse_scored
          ) order by q.order_index
        ), '[]'::jsonb)
        from public.questions q
        where q.assessment_definition_id = ca.assessment_definition_id
          and (q.role_variant is not distinct from ca.role_variant)
      ),
      'responses', (
        select coalesce(jsonb_agg(
          jsonb_build_object('question_id', r.question_id, 'answer_json', r.answer_json)
        ), '[]'::jsonb)
        from public.responses r
        where r.candidate_assessment_id = ca.id
      )
    )
  ) into v_assessments
  from public.candidate_assessments ca
  join public.assessment_definitions ad on ad.id = ca.assessment_definition_id
  where ca.unique_token = p_token;

  return jsonb_build_object('candidate', v_candidate, 'assessments', v_assessments);
end;
$$;

grant execute on function public.get_assessment_by_token(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- save_response: guarda/actualiza una respuesta individual, validando que
-- el token sea válido, que la pregunta pertenezca a esa batería/rol y que
-- la batería no esté ya completada ni expirada.
-- ----------------------------------------------------------------------------
create or replace function public.save_response(
  p_token text,
  p_candidate_assessment_id uuid,
  p_question_id uuid,
  p_answer jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ca record;
  v_question_exists boolean;
begin
  select ca.* into v_ca
  from public.candidate_assessments ca
  where ca.id = p_candidate_assessment_id and ca.unique_token = p_token;

  if v_ca is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_ca.status = 'completed' then
    return jsonb_build_object('error', 'already_completed');
  end if;

  if v_ca.expires_at < now() then
    return jsonb_build_object('error', 'expired');
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

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.save_response(text, uuid, uuid, jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- update_candidate_personal_info: permite al candidato completar/confirmar
-- su nombre y teléfono en el paso 1 (el email lo fija el admin y no se
-- puede modificar desde este canal).
-- ----------------------------------------------------------------------------
create or replace function public.update_candidate_personal_info(
  p_token text,
  p_full_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid;
begin
  select candidate_id into v_candidate_id
  from public.candidate_assessments
  where unique_token = p_token
  limit 1;

  if v_candidate_id is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  update public.candidates
  set full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
      phone = coalesce(nullif(trim(p_phone), ''), phone)
  where id = v_candidate_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.update_candidate_personal_info(text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- complete_candidate_assessment: marca una batería específica (dentro del
-- token) como completada, solo si todas sus preguntas tienen respuesta.
-- El cálculo y guardado de scores se hace en la capa de aplicación
-- (lib/scoring) usando la service role key, inmediatamente después de una
-- llamada exitosa a esta función.
-- ----------------------------------------------------------------------------
create or replace function public.complete_candidate_assessment(
  p_token text,
  p_candidate_assessment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ca record;
  v_total_questions integer;
  v_answered integer;
begin
  select ca.* into v_ca
  from public.candidate_assessments ca
  where ca.id = p_candidate_assessment_id and ca.unique_token = p_token;

  if v_ca is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_ca.status = 'completed' then
    return jsonb_build_object('ok', true, 'already', true);
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

grant execute on function public.complete_candidate_assessment(text, uuid) to anon, authenticated;

-- ============================================================================
-- SEED: 7 assessment_definitions fijas
-- ============================================================================
insert into public.assessment_definitions (code, name, description, config_json)
values
  ('behavioral', 'Comportamiento (estilo DISC)',
   'Evaluación de estilo conductual mediante elección forzada de frases (formato tipo Cleaver/DISC).',
   '{"question_type":"forced_choice_quad","dimensions":[
      {"code":"D","label":"Dominancia"},
      {"code":"I","label":"Influencia"},
      {"code":"S","label":"Estabilidad"},
      {"code":"C","label":"Cumplimiento"}
   ]}'::jsonb),

  ('cognitive', 'Razonamiento Cognitivo',
   'Pruebas de opción múltiple de razonamiento verbal, numérico y abstracto.',
   '{"question_type":"multiple_choice","dimensions":[
      {"code":"verbal","label":"Razonamiento Verbal"},
      {"code":"numerico","label":"Razonamiento Numérico"},
      {"code":"abstracto","label":"Razonamiento Abstracto"}
   ]}'::jsonb),

  ('personality', 'Inventario de Personalidad',
   'Inventario tipo Likert de 5 puntos sobre rasgos de personalidad (modelo de cinco factores).',
   '{"question_type":"likert5","dimensions":[
      {"code":"apertura","label":"Apertura a la Experiencia"},
      {"code":"responsabilidad","label":"Responsabilidad"},
      {"code":"extraversion","label":"Extraversión"},
      {"code":"amabilidad","label":"Amabilidad"},
      {"code":"estabilidad_emocional","label":"Estabilidad Emocional"}
   ]}'::jsonb),

  ('competencies', 'Competencias Generales',
   'Autoevaluación Likert de competencias transversales.',
   '{"question_type":"likert5","dimensions":[
      {"code":"comunicacion","label":"Comunicación"},
      {"code":"trabajo_equipo","label":"Trabajo en Equipo"},
      {"code":"resolucion_problemas","label":"Resolución de Problemas"},
      {"code":"adaptabilidad","label":"Adaptabilidad"}
   ]}'::jsonb),

  ('values', 'Inventario de Valores',
   'Autoevaluación Likert de valores y ética laboral.',
   '{"question_type":"likert5","dimensions":[
      {"code":"integridad","label":"Integridad"},
      {"code":"compromiso","label":"Compromiso"},
      {"code":"respeto","label":"Respeto"},
      {"code":"orientacion_logro","label":"Orientación al Logro"}
   ]}'::jsonb),

  ('leadership', 'Potencial de Liderazgo',
   'Autoevaluación Likert de competencias de liderazgo.',
   '{"question_type":"likert5","dimensions":[
      {"code":"vision","label":"Visión Estratégica"},
      {"code":"delegacion","label":"Delegación"},
      {"code":"influencia","label":"Influencia e Inspiración"},
      {"code":"desarrollo_equipo","label":"Desarrollo de Equipo"}
   ]}'::jsonb),

  ('role_specific', 'Competencias Específicas del Rol',
   'Batería configurable por rol: el admin elige un rol y se cargan solo las preguntas de esa variante.',
   '{"question_type":"likert5","roles":[
      {"code":"sales","label":"Ventas","dimensions":[{"code":"prospeccion","label":"Prospección"},{"code":"cierre","label":"Cierre de Ventas"},{"code":"relacion_cliente","label":"Relación con el Cliente"}]},
      {"code":"commercial_manager","label":"Gerente Comercial","dimensions":[{"code":"gestion_equipo_comercial","label":"Gestión de Equipo Comercial"},{"code":"planeacion_estrategica","label":"Planeación Estratégica"},{"code":"negociacion","label":"Negociación"}]},
      {"code":"director","label":"Director","dimensions":[{"code":"vision_negocio","label":"Visión de Negocio"},{"code":"toma_decisiones","label":"Toma de Decisiones"},{"code":"gestion_stakeholders","label":"Gestión de Stakeholders"}]},
      {"code":"consultant","label":"Consultor","dimensions":[{"code":"analisis_problemas","label":"Análisis de Problemas"},{"code":"comunicacion_cliente","label":"Comunicación con el Cliente"},{"code":"adaptabilidad_proyectos","label":"Adaptabilidad a Proyectos"}]},
      {"code":"analyst","label":"Analista","dimensions":[{"code":"precision_datos","label":"Precisión con Datos"},{"code":"pensamiento_critico","label":"Pensamiento Crítico"},{"code":"documentacion","label":"Documentación"}]},
      {"code":"operations","label":"Operaciones","dimensions":[{"code":"eficiencia_procesos","label":"Eficiencia de Procesos"},{"code":"gestion_calidad","label":"Gestión de Calidad"},{"code":"resolucion_incidentes","label":"Resolución de Incidentes"}]},
      {"code":"hr","label":"RRHH","dimensions":[{"code":"gestion_talento","label":"Gestión de Talento"},{"code":"relaciones_laborales","label":"Relaciones Laborales"},{"code":"comunicacion_organizacional","label":"Comunicación Organizacional"}]}
   ]}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  config_json = excluded.config_json;

-- ============================================================================
-- SEED: preguntas de ejemplo (2-3 por batería). La FASE 2 agregará el resto
-- (cientos de ítems) sin requerir cambios de esquema.
-- ============================================================================

-- behavioral (forced_choice_quad): 3 bloques de ejemplo (en producción real
-- serían ~28 bloques). Cada bloque tiene 4 frases, una por dimensión D/I/S/C.
insert into public.questions (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'forced_choice_quad', 'DISC', v.prompt_text, v.options_json::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'Bloque 1: Elige la frase que MÁS y la que MENOS te describe en el trabajo.',
   '{"options":[
      {"text":"Tomo el control de la situación rápidamente","dimension":"D"},
      {"text":"Disfruto socializar y motivar a otros","dimension":"I"},
      {"text":"Prefiero un ritmo de trabajo estable y predecible","dimension":"S"},
      {"text":"Sigo procedimientos y reglas cuidadosamente","dimension":"C"}
   ]}'),
  (2, 'Bloque 2: Elige la frase que MÁS y la que MENOS te describe en el trabajo.',
   '{"options":[
      {"text":"Me gusta competir y ganar","dimension":"D"},
      {"text":"Persuado fácilmente a otras personas","dimension":"I"},
      {"text":"Soy paciente y buen escucha","dimension":"S"},
      {"text":"Soy muy detallista y organizado","dimension":"C"}
   ]}'),
  (3, 'Bloque 3: Elige la frase que MÁS y la que MENOS te describe en el trabajo.',
   '{"options":[
      {"text":"Tomo decisiones rápidas bajo presión","dimension":"D"},
      {"text":"Genero entusiasmo en el equipo","dimension":"I"},
      {"text":"Mantengo la calma ante los cambios","dimension":"S"},
      {"text":"Verifico dos veces antes de entregar un trabajo","dimension":"C"}
   ]}')
) as v(order_index, prompt_text, options_json)
where ad.code = 'behavioral'
on conflict do nothing;

-- cognitive (multiple_choice): 3 preguntas de ejemplo
insert into public.questions (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'multiple_choice', v.dimension, v.prompt_text, v.options_json::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'numerico', '¿Qué número continúa la serie: 2, 4, 8, 16, __?',
   '{"choices":["18","24","32","20"],"correct_index":2}'),
  (2, 'verbal', 'Elige el sinónimo de "diligente":',
   '{"choices":["Perezoso","Cuidadoso y aplicado","Distraído","Impaciente"],"correct_index":1}'),
  (3, 'abstracto', 'Si todos los ZUL son ROP, y algunos ROP son TAK, entonces:',
   '{"choices":["Todos los ZUL son TAK","Algunos ZUL podrían ser TAK","Ningún ZUL es TAK","Todos los TAK son ZUL"],"correct_index":1}')
) as v(order_index, dimension, prompt_text, options_json)
where ad.code = 'cognitive'
on conflict do nothing;

-- personality (likert5): 3 preguntas de ejemplo (una con reverse scoring)
insert into public.questions (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"]}'::jsonb, v.is_reverse
from public.assessment_definitions ad,
(values
  (1, 'apertura', 'Disfruto explorar ideas y enfoques nuevos en mi trabajo.', false),
  (2, 'responsabilidad', 'Suelo dejar tareas a medias cuando pierdo el interés.', true),
  (3, 'extraversion', 'Me energiza interactuar con muchas personas durante el día.', false)
) as v(order_index, dimension, prompt_text, is_reverse)
where ad.code = 'personality'
on conflict do nothing;

-- competencies (likert5): 3 preguntas de ejemplo
insert into public.questions (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'comunicacion', 'Explico mis ideas de forma clara y son fáciles de entender.'),
  (2, 'trabajo_equipo', 'Colaboro activamente para lograr los objetivos del equipo.'),
  (3, 'resolucion_problemas', 'Identifico la causa raíz de un problema antes de actuar.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'competencies'
on conflict do nothing;

-- values (likert5): 3 preguntas de ejemplo
insert into public.questions (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'integridad', 'Actúo de forma honesta incluso cuando nadie más lo notaría.'),
  (2, 'compromiso', 'Cumplo mis compromisos aunque implique esfuerzo extra.'),
  (3, 'respeto', 'Trato a todas las personas con respeto, sin importar su cargo.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'values'
on conflict do nothing;

-- leadership (likert5): 3 preguntas de ejemplo
insert into public.questions (assessment_definition_id, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'vision', 'Puedo articular una visión clara de hacia dónde debe ir un equipo.'),
  (2, 'delegacion', 'Delego tareas confiando en las capacidades de otros.'),
  (3, 'desarrollo_equipo', 'Invierto tiempo en desarrollar las habilidades de mi equipo.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'leadership'
on conflict do nothing;

-- role_specific (likert5): 3 preguntas para 'sales' y 3 para 'director'
-- (fase 2 completará consultant, analyst, operations, hr, commercial_manager)
insert into public.questions (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'sales'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'prospeccion', 'Identifico con facilidad nuevos prospectos de venta.'),
  (2, 'cierre', 'Sé reconocer el momento adecuado para cerrar una venta.'),
  (3, 'relacion_cliente', 'Construyo relaciones de largo plazo con mis clientes.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

insert into public.questions (assessment_definition_id, role_variant, order_index, question_type, dimension, prompt_text, options_json, is_reverse_scored)
select ad.id, 'director'::role_variant_code, v.order_index, 'likert5', v.dimension, v.prompt_text, '{"scale_labels":["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"]}'::jsonb, false
from public.assessment_definitions ad,
(values
  (1, 'vision_negocio', 'Anticipo tendencias del negocio antes que la competencia.'),
  (2, 'toma_decisiones', 'Tomo decisiones difíciles con información incompleta.'),
  (3, 'gestion_stakeholders', 'Gestiono efectivamente expectativas de múltiples interesados.')
) as v(order_index, dimension, prompt_text)
where ad.code = 'role_specific'
on conflict do nothing;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

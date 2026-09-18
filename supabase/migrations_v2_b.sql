-- ============================================================================
-- MIGRACIÓN V2 — FASE B: PANEL ADMIN AMPLIADO (AUDITORÍA)
-- ============================================================================
-- Este archivo es una EXTENSIÓN ADITIVA de supabase/schema.sql +
-- supabase/migrations_v2.sql. Ambos deben estar ya aplicados (en ese orden)
-- antes de correr esto. A diferencia de migrations_v2.sql, ESTE archivo NO
-- es destructivo: no hace ningún `truncate`, no borra ni transforma datos
-- existentes. Se ejecuta completo, en un solo "Run" del SQL Editor de
-- Supabase (no necesita dos pasadas: no toca ningún enum).
--
-- Qué agrega:
--   1) Tabla `public.audit_logs` + RLS de solo lectura para el admin dueño.
--
-- Todo lo demás de la Fase B (mostrar contraseña temporal al crear un
-- candidato, tiempo límite configurable por batería, revocar acceso, visor
-- de respuestas, dashboard ampliado, filtros de candidatos, reportes
-- parciales) se apoya en columnas/políticas que YA EXISTÍAN desde
-- migrations_v2.sql (`time_limit_minutes`, el valor de enum `revoked`, y la
-- policy `candidate_assessments_owner` que ya permite `update` al admin
-- dueño) — no requieren cambios de esquema nuevos, solo código de
-- aplicación (ver README.md, sección "Fase B (v2)").
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLA: audit_logs
--
-- Bitácora de eventos relevantes del sistema (candidato creado, prueba
-- iniciada/completada/revocada, reporte generado, PDF descargado). Se
-- escribe EXCLUSIVAMENTE desde código de aplicación con la SERVICE ROLE key
-- (ver lib/audit/log.ts) — no hay triggers SQL. Por eso esta tabla NO tiene
-- ninguna policy de INSERT/UPDATE/DELETE para el rol `authenticated`: un
-- admin autenticado con el `anon`/sesión normal no puede escribir aquí
-- directamente (solo el backend, que bypassa RLS con la service role).
--
-- `entity_id` puede apuntar a distintas tablas según `entity_type`
-- ('candidate' -> candidates.id, 'candidate_assessment' ->
-- candidate_assessments.id, 'report' -> reports.id, 'system' -> sin
-- referencia real, ej. un cron o script). Por eso no lleva foreign key
-- física (no hay una sola tabla destino posible) y la policy de lectura
-- resuelve la propiedad con un OR por tipo, ver abajo.
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_type text not null check (actor_type in ('admin', 'candidate', 'system')),
  action text not null,
  entity_type text not null check (entity_type in ('candidate', 'candidate_assessment', 'report', 'system')),
  entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;

-- Solo lectura para el admin dueño del candidato relacionado (join por
-- entity_type, igual patrón "exists (select 1 from ... join ... where
-- admin_id = auth.uid())" ya usado en candidate_assessments/responses/
-- scores/reports de schema.sql). También se permite leer las filas donde el
-- propio admin fue el actor (ej. 'candidate' creado por él, aunque el
-- candidato ya no exista).
drop policy if exists audit_logs_owner_read on public.audit_logs;
create policy audit_logs_owner_read on public.audit_logs
  for select
  to authenticated
  using (
    actor_id = auth.uid()
    or (
      entity_type = 'candidate'
      and exists (
        select 1 from public.candidates c
        where c.id = audit_logs.entity_id and c.admin_id = auth.uid()
      )
    )
    or (
      entity_type = 'candidate_assessment'
      and exists (
        select 1
        from public.candidate_assessments ca
        join public.candidates c on c.id = ca.candidate_id
        where ca.id = audit_logs.entity_id and c.admin_id = auth.uid()
      )
    )
    or (
      entity_type = 'report'
      and exists (
        select 1 from public.reports r
        join public.candidates c on c.id = r.candidate_id
        where r.id = audit_logs.entity_id and c.admin_id = auth.uid()
      )
    )
  );

-- Sin policies de insert/update/delete a propósito: solo la service role
-- (que bypassa RLS) puede escribir, desde lib/audit/log.ts.

-- ----------------------------------------------------------------------------
-- FASE C (auditoría de integración) — retirar el flujo anónimo por
-- `unique_token` de verdad, no solo "dejarlo sin usar" en el frontend.
--
-- Contexto / bug encontrado: migrations_v2.sql (Fase A) documentaba el
-- flujo viejo (`get_assessment_by_token`, `save_response`,
-- `update_candidate_personal_info`, `complete_candidate_assessment`,
-- concedidas a `anon, authenticated`) como "se deja intacto por
-- compatibilidad". En la práctica, `app/api/assign/route.ts` (sin cambios
-- desde Fase 1) seguía generando un `unique_token` funcional para CADA
-- asignación nueva, y `components/admin/AssignAssessmentForm.tsx` lo
-- mostraba al admin como "Link generado" para copiar y enviar al
-- candidato. Ese link:
--   1) NO exige login (concedida a `anon`) — cualquiera con el link entra.
--   2) Auto-inicia el examen con solo cargar la página
--      (`get_assessment_by_token` hace `status='in_progress',
--      started_at=now()` como efecto lateral de un simple SELECT) — este
--      es EXACTAMENTE el bug del flujo viejo que la Fase A se propuso
--      corregir para el portal nuevo.
--   3) Ignora por completo `time_limit_minutes`: su `expires_at` es la
--      validez del link (30 días por defecto), no un cronómetro real, y
--      `complete_candidate_assessment` nunca compara contra ese `expires_at`.
-- Es decir, el flujo viejo SÍ interfería con el nuevo: convivían dos
-- caminos de acceso a la misma fila de `candidate_assessments`, uno con
-- las garantías de la Fase A/B (login, cronómetro real, un solo
-- "Iniciar") y otro sin ninguna de ellas. Se corrigió en el código de
-- aplicación (ya no se genera/expone el link en el admin), pero eso por
-- sí solo no cierra el acceso: alguien con un link viejo copiado antes de
-- este fix seguiría pudiendo usarlo. Por eso, además, se revoca aquí el
-- permiso de ejecución de las 4 funciones viejas.
--
-- Es seguro hacerlo porque, desde la Pasada 2 de migrations_v2.sql, TODO
-- candidato en `public.candidates` tiene obligatoriamente un usuario real
-- de `auth.users` (la columna `id` ahora es FK a `auth.users`), y esa
-- misma migración ya truncó cualquier `candidate_assessments` que
-- dependiera del flujo anónimo. No existe, a partir de la Fase A, ningún
-- candidato legítimo que dependa de acceso 100% anónimo por token. Las
-- funciones y las rutas `/assessment/[token]` y `/api/assessment/[token]/*`
-- NO se borran (para no romper el build ni perder el código de
-- referencia), simplemente quedan inertes: cualquier llamada falla con
-- "permission denied for function ..." y el frontend viejo
-- (`AssessmentPortalClient.tsx`) ya maneja ese error mostrando "no
-- encontrado" (ver `app/api/assessment/[token]/route.ts`, que traduce
-- cualquier error de la RPC en un 404/500 sin romper la página).
--
-- Si en algún momento se decide reactivar un acceso sin login (no
-- recomendado), basta con volver a correr los 4 `grant execute` que
-- siguen comentados en `supabase/schema.sql` para esas funciones.
-- ----------------------------------------------------------------------------
revoke execute on function public.get_assessment_by_token(text) from anon, authenticated;
revoke execute on function public.save_response(text, uuid, uuid, jsonb) from anon, authenticated;
revoke execute on function public.update_candidate_personal_info(text, text, text) from anon, authenticated;
revoke execute on function public.complete_candidate_assessment(text, uuid) from anon, authenticated;

-- ============================================================================
-- FIN migrations_v2_b.sql (Fase B)
-- ============================================================================

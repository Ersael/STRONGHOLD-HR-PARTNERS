import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ASSESSMENT_DEFINITIONS_META } from "@/lib/constants";
import type { AssessmentCode, AssessmentStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Criterio de "estado global" de un candidato (Fase B, decisión de diseño):
// un candidato no tiene un único `status` propio (eso vive por batería, en
// `candidate_assessments`), así que para poder filtrar la lista por "estado"
// se define una prioridad: se toma el estado MÁS urgente/con más necesidad
// de acción entre TODAS sus baterías asignadas, en este orden (de mayor a
// menor prioridad):
//   in_progress > pending > expired > completed > revoked > sin_evaluaciones
// Ej.: un candidato con una batería 'completed' y otra 'pending' se muestra
// como 'pending' (todavía requiere acción); uno con todo 'completed' y
// 'revoked' se muestra 'completed' (lo revocado ya no importa). Se
// documenta también en README.md.
// ---------------------------------------------------------------------------
const GLOBAL_STATUS_PRIORITY: AssessmentStatus[] = ["in_progress", "pending", "expired", "completed", "revoked"];

type GlobalStatus = AssessmentStatus | "sin_evaluaciones";

function computeGlobalStatus(statuses: AssessmentStatus[]): GlobalStatus {
  for (const candidate of GLOBAL_STATUS_PRIORITY) {
    if (statuses.includes(candidate)) return candidate;
  }
  return "sin_evaluaciones";
}

const GLOBAL_STATUS_LABELS: Record<GlobalStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  expired: "Tiempo agotado",
  revoked: "Anulada",
  sin_evaluaciones: "Sin evaluaciones",
};

const GLOBAL_STATUS_COLORS: Record<GlobalStatus, string> = {
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-700",
  revoked: "bg-gray-200 text-gray-600",
  sin_evaluaciones: "bg-gray-50 text-gray-400",
};

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    position?: string;
    status?: string;
    battery?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { search, position, status, battery, from, to } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("candidates").select("*").order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (position) {
    query = query.ilike("position_applied", `%${position}%`);
  }
  if (from) {
    query = query.gte("created_at", new Date(from).toISOString());
  }
  if (to) {
    // Incluye todo el día `to` (hasta 23:59:59.999).
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  const { data: candidatesRaw, error } = await query;
  const candidates = candidatesRaw ?? [];

  // Se resuelve el "estado global" y las baterías asignadas de cada
  // candidato con 2 consultas adicionales (en vez de un embed complejo),
  // para mantener el código simple y explícito.
  const candidateIds = candidates.map((c) => c.id);
  const [{ data: assessments }, { data: definitions }] = await Promise.all([
    candidateIds.length > 0
      ? supabase
          .from("candidate_assessments")
          .select("candidate_id, status, assessment_definition_id")
          .in("candidate_id", candidateIds)
      : Promise.resolve({ data: [] as Array<{ candidate_id: string; status: AssessmentStatus; assessment_definition_id: string }> }),
    supabase.from("assessment_definitions").select("id, code"),
  ]);

  const codeByDefinitionId = new Map((definitions ?? []).map((d) => [d.id, d.code as AssessmentCode]));
  const statusesByCandidate = new Map<string, AssessmentStatus[]>();
  const codesByCandidate = new Map<string, Set<AssessmentCode>>();

  for (const a of assessments ?? []) {
    const statuses = statusesByCandidate.get(a.candidate_id) ?? [];
    statuses.push(a.status);
    statusesByCandidate.set(a.candidate_id, statuses);

    const code = codeByDefinitionId.get(a.assessment_definition_id);
    if (code) {
      const codes = codesByCandidate.get(a.candidate_id) ?? new Set<AssessmentCode>();
      codes.add(code);
      codesByCandidate.set(a.candidate_id, codes);
    }
  }

  let filteredCandidates = candidates.map((c) => ({
    ...c,
    globalStatus: computeGlobalStatus(statusesByCandidate.get(c.id) ?? []),
    assignedCodes: codesByCandidate.get(c.id) ?? new Set<AssessmentCode>(),
  }));

  if (status) {
    filteredCandidates = filteredCandidates.filter((c) => c.globalStatus === status);
  }
  if (battery) {
    filteredCandidates = filteredCandidates.filter((c) => c.assignedCodes.has(battery as AssessmentCode));
  }

  const hasFilters = Boolean(search || position || status || battery || from || to);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-950">Candidatos</h1>
        <Link
          href="/admin/candidates/new"
          className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
        >
          + Nuevo candidato
        </Link>
      </div>

      <form className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3" method="get">
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Buscar por nombre o correo..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="position"
          defaultValue={position ?? ""}
          placeholder="Filtrar por puesto aplicado..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {(Object.keys(GLOBAL_STATUS_LABELS) as GlobalStatus[]).map((s) => (
            <option key={s} value={s}>
              {GLOBAL_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select name="battery" defaultValue={battery ?? ""} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="">Todas las baterías</option>
          {ASSESSMENT_DEFINITIONS_META.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <label className="flex items-center gap-1">
            Desde
            <input type="date" name="from" defaultValue={from ?? ""} className="rounded-md border border-gray-300 px-2 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-1">
            Hasta
            <input type="date" name="to" defaultValue={to ?? ""} className="rounded-md border border-gray-300 px-2 py-2 text-sm" />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/admin/candidates"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-red-600">Error al cargar candidatos: {error.message}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Puesto aplicado</th>
              <th className="px-4 py-3 font-medium">Estado global</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCandidates.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-600">{c.position_applied ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${GLOBAL_STATUS_COLORS[c.globalStatus]}`}>
                    {GLOBAL_STATUS_LABELS[c.globalStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.created_at).toLocaleDateString("es-MX")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/candidates/${c.id}`} className="text-indigo-700 hover:underline">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
            {filteredCandidates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No hay candidatos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";

/**
 * Vista de auditoría (Fase B): lista de solo lectura de `public.audit_logs`,
 * protegida por la policy `audit_logs_owner_read`
 * (supabase/migrations_v2_b.sql) — un admin solo ve eventos relacionados a
 * sus propios candidatos (o donde él mismo fue el actor). No hay filtros ni
 * paginación sofisticada a propósito: es una bitácora de auditoría simple,
 * con scroll, para revisar manualmente qué pasó y cuándo.
 */
export default async function AuditLogPage() {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-indigo-950">Auditoría</h1>
        <p className="text-sm text-gray-500">
          Últimos 300 eventos registrados: candidatos creados, pruebas iniciadas/completadas/revocadas,
          reportes generados y PDFs descargados.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Error al cargar la auditoría: {error.message}. Si el error menciona que la tabla no existe,
          asegúrate de haber corrido <code>supabase/migrations_v2_b.sql</code>.
        </p>
      )}

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Acción</th>
              <th className="px-4 py-3 font-medium">Entidad</th>
              <th className="px-4 py-3 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(logs ?? []).map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                  {new Date(log.created_at).toLocaleString("es-MX")}
                </td>
                <td className="px-4 py-2 text-gray-600">{log.actor_type}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{log.action}</td>
                <td className="px-4 py-2 text-gray-500">
                  {log.entity_type}
                  {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ""}
                </td>
                <td className="max-w-xs truncate px-4 py-2 text-xs text-gray-400" title={JSON.stringify(log.metadata_json)}>
                  {JSON.stringify(log.metadata_json)}
                </td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Todavía no hay eventos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

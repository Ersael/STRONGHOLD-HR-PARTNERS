import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; position?: string }>;
}) {
  const { search, position } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("candidates").select("*").order("created_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (position) {
    query = query.ilike("position_applied", `%${position}%`);
  }

  const { data: candidates, error } = await query;

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

      <form className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm" method="get">
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Buscar por nombre o correo..."
          className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="position"
          defaultValue={position ?? ""}
          placeholder="Filtrar por puesto aplicado..."
          className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          Filtrar
        </button>
        {(search || position) && (
          <Link
            href="/admin/candidates"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Limpiar
          </Link>
        )}
      </form>

      {error && <p className="text-sm text-red-600">Error al cargar candidatos: {error.message}</p>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Puesto aplicado</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(candidates ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-600">{c.position_applied ?? "—"}</td>
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
            {(candidates ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
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

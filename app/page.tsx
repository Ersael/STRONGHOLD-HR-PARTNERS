import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold text-indigo-950">Plataforma de Evaluación Psicométrica</h1>
      <p className="max-w-xl text-gray-600">
        Administra procesos de selección con baterías de comportamiento, razonamiento cognitivo,
        personalidad, competencias, valores, liderazgo y competencias específicas por rol.
      </p>
      <Link
        href="/admin/login"
        className="rounded-lg bg-indigo-700 px-6 py-3 font-medium text-white shadow hover:bg-indigo-800"
      >
        Acceso administradores
      </Link>
      <p className="max-w-lg text-xs text-gray-400">
        Los candidatos acceden mediante el link único que les envía su reclutador; no requieren
        crear una cuenta.
      </p>
    </main>
  );
}

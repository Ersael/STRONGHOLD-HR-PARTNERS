"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateReportButton({ candidateId, hasReport }: { candidateId: string; hasReport: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/reports/${candidateId}`, { method: "POST" });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "No se pudo generar el reporte.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
        >
          {loading ? "Generando..." : hasReport ? "Regenerar reporte" : "Generar reporte"}
        </button>
        {hasReport && (
          <a
            href={`/api/reports/${candidateId}/pdf`}
            className="rounded-md border border-indigo-700 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Descargar PDF
          </a>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

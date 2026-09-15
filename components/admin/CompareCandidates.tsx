"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface CandidateOption {
  id: string;
  full_name: string;
}

interface DimensionScoreEntry {
  dimension: string;
  dimension_label: string;
  normalized_score: number;
}

interface CompareResult {
  id: string;
  full_name: string;
  scores: DimensionScoreEntry[];
}

const CHART_COLORS = ["#4338ca", "#0d9488", "#d97706", "#dc2626"];

export function CompareCandidates({ candidates }: { candidates: CandidateOption[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<CompareResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  async function handleCompare() {
    setError(null);
    if (selected.length < 2) {
      setError("Selecciona entre 2 y 4 candidatos.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_ids: selected }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "No se pudo comparar a los candidatos.");
      return;
    }
    setResults(body.candidates);
  }

  const chartData = useMemo(() => {
    if (!results) return [];
    const dimensionLabels = new Map<string, string>();
    for (const r of results) {
      for (const s of r.scores) dimensionLabels.set(s.dimension, s.dimension_label);
    }
    return Array.from(dimensionLabels.entries()).map(([dimension, label]) => {
      const row: Record<string, string | number> = { dimension: label };
      for (const r of results) {
        const found = r.scores.find((s) => s.dimension === dimension);
        row[r.full_name] = found ? found.normalized_score : 0;
      }
      return row;
    });
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-indigo-950">Elige entre 2 y 4 candidatos</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
                disabled={!selected.includes(c.id) && selected.length >= 4}
              />
              {c.full_name}
            </label>
          ))}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleCompare}
          disabled={loading}
          className="mt-4 rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
        >
          {loading ? "Comparando..." : "Comparar"}
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="h-96 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dimension" angle={-35} textAnchor="end" interval={0} height={90} fontSize={11} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                {results.map((r, i) => (
                  <Bar key={r.id} dataKey={r.full_name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Dimensión</th>
                  {results.map((r) => (
                    <th key={r.id} className="px-3 py-2 font-medium">
                      {r.full_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chartData.map((row) => (
                  <tr key={row.dimension as string}>
                    <td className="px-3 py-2 font-medium text-gray-800">{row.dimension}</td>
                    {results.map((r) => (
                      <td key={r.id} className="px-3 py-2">
                        {Math.round(Number(row[r.full_name] ?? 0))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

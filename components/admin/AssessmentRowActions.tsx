"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentStatus } from "@/types/database";

/**
 * Acciones administrativas por batería asignada, en la ficha del candidato
 * (Fase B):
 *  - `pending`: tiempo límite editable (PATCH) + botón "Revocar".
 *  - `in_progress`: tiempo límite de solo lectura (con nota de por qué) +
 *    botón "Revocar".
 *  - `completed` / `expired`: link al visor de respuestas individuales.
 *  - `revoked`: sin acciones, solo informativo (ya es un estado terminal).
 */
export function AssessmentRowActions({
  candidateId,
  candidateAssessmentId,
  status,
  timeLimitMinutes,
}: {
  candidateId: string;
  candidateAssessmentId: string;
  status: AssessmentStatus;
  timeLimitMinutes: number;
}) {
  const router = useRouter();
  const [minutes, setMinutes] = useState(timeLimitMinutes);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMinutes, setSavedMinutes] = useState(timeLimitMinutes);

  async function saveMinutes() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/candidate-assessments/${candidateAssessmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time_limit_minutes: minutes }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(body.error ?? "No se pudo actualizar el tiempo límite.");
      return;
    }
    setSavedMinutes(minutes);
    router.refresh();
  }

  async function revoke() {
    if (!window.confirm("¿Revocar esta evaluación? El candidato ya no podrá iniciarla ni continuarla.")) {
      return;
    }
    setRevoking(true);
    setError(null);
    const res = await fetch(`/api/candidate-assessments/${candidateAssessmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "revoked" }),
    });
    const body = await res.json().catch(() => ({}));
    setRevoking(false);
    if (!res.ok) {
      setError(body.error ?? "No se pudo revocar la evaluación.");
      return;
    }
    router.refresh();
  }

  if (status === "completed" || status === "expired") {
    return (
      <Link
        href={`/admin/candidates/${candidateId}/assessments/${candidateAssessmentId}`}
        className="text-xs font-medium text-indigo-700 hover:underline"
      >
        Ver respuestas
      </Link>
    );
  }

  if (status === "revoked") {
    return <p className="text-xs text-gray-400">Sin acciones disponibles (estado final).</p>;
  }

  // pending | in_progress
  return (
    <div className="space-y-1 text-right">
      <div className="flex items-center justify-end gap-2">
        {status === "pending" ? (
          <>
            <input
              type="number"
              min={5}
              max={240}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(5, Math.min(240, Number(e.target.value) || 5)))}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right text-xs"
            />
            <span className="text-xs text-gray-500">min</span>
            {minutes !== savedMinutes && (
              <button
                onClick={saveMinutes}
                disabled={saving}
                className="rounded-md bg-indigo-700 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                {saving ? "..." : "Guardar"}
              </button>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-500" title="El tiempo límite ya no se puede editar porque la batería está en curso.">
            {timeLimitMinutes} min (no editable: en curso)
          </span>
        )}
        <button
          onClick={revoke}
          disabled={revoking}
          className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {revoking ? "..." : "Revocar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

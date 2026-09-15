"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROLE_VARIANTS } from "@/lib/constants";
import type { AssessmentCode, RoleVariantCode } from "@/types/database";

interface AssessmentDefinitionOption {
  id: string;
  code: AssessmentCode;
  name: string;
}

export function AssignAssessmentForm({
  candidateId,
  definitions,
}: {
  candidateId: string;
  definitions: AssessmentDefinitionOption[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roleVariant, setRoleVariant] = useState<RoleVariantCode | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const needsRole = definitions
    .filter((d) => selectedIds.includes(d.id))
    .some((d) => d.code === "role_specific");

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    setError(null);
    if (selectedIds.length === 0) {
      setError("Selecciona al menos una batería.");
      return;
    }
    if (needsRole && !roleVariant) {
      setError("Elige un rol para la batería de Competencias Específicas del Rol.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_id: candidateId,
        assessment_definition_ids: selectedIds,
        role_variant: needsRole ? roleVariant : null,
      }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "No se pudo asignar la evaluación.");
      return;
    }

    setResultUrl(`${window.location.origin}${body.assessment_url}`);
    setSelectedIds([]);
    setRoleVariant("");
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-indigo-950">Asignar evaluación</h3>

      <div className="space-y-2">
        {definitions.map((def) => (
          <label key={def.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.includes(def.id)}
              onChange={() => toggle(def.id)}
            />
            {def.name}
          </label>
        ))}
      </div>

      {needsRole && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Rol para Competencias Específicas</label>
          <select
            value={roleVariant}
            onChange={(e) => setRoleVariant(e.target.value as RoleVariantCode)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Selecciona un rol...</option>
            {ROLE_VARIANTS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {loading ? "Asignando..." : "Asignar y generar link"}
      </button>

      {resultUrl && (
        <div className="rounded-md bg-green-50 p-3 text-sm">
          <p className="mb-1 font-medium text-green-800">Link generado:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white px-2 py-1 text-xs text-gray-700">
              {resultUrl}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(resultUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-md border border-green-300 px-2 py-1 text-xs font-medium text-green-800 hover:bg-green-100"
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

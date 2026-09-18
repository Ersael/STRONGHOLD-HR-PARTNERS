"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_TIME_LIMIT_MINUTES, ROLE_VARIANTS } from "@/lib/constants";
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
  const [assigned, setAssigned] = useState(false);
  // Minutos de tiempo límite por batería seleccionada, pre-cargados con los
  // defaults de lib/constants.ts (DEFAULT_TIME_LIMIT_MINUTES) según el code
  // de cada assessment_definition, editables antes de guardar.
  const [minutesByDefId, setMinutesByDefId] = useState<Record<string, number>>({});

  const needsRole = definitions
    .filter((d) => selectedIds.includes(d.id))
    .some((d) => d.code === "role_specific");

  function toggle(id: string, code: AssessmentCode) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setMinutesByDefId((prev) =>
      prev[id] !== undefined ? prev : { ...prev, [id]: DEFAULT_TIME_LIMIT_MINUTES[code] ?? 30 },
    );
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
        time_limits: Object.fromEntries(
          selectedIds.map((id) => [id, minutesByDefId[id] ?? DEFAULT_TIME_LIMIT_MINUTES.behavioral]),
        ),
      }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "No se pudo asignar la evaluación.");
      return;
    }

    // No hay ningún link que copiar/compartir: el candidato ya tiene sus
    // credenciales de acceso (email + contraseña temporal, entregadas una
    // sola vez al crearlo, ver CredentialsModal.tsx) y verá esta(s)
    // batería(s) nueva(s) en su panel apenas inicie sesión en
    // /candidate/login. Mostrar un link alternativo aquí reintroduciría el
    // flujo anónimo viejo que la Fase A retiró (ver app/api/assign/route.ts).
    setAssigned(true);
    setSelectedIds([]);
    setRoleVariant("");
    setMinutesByDefId({});
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-indigo-950">Asignar evaluación</h3>

      <div className="space-y-2">
        {definitions.map((def) => {
          const isSelected = selectedIds.includes(def.id);
          return (
            <div key={def.id} className="flex items-center justify-between gap-3 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input type="checkbox" checked={isSelected} onChange={() => toggle(def.id, def.code)} />
                {def.name}
              </label>
              {isSelected && (
                <label className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                  Tiempo límite
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={minutesByDefId[def.id] ?? DEFAULT_TIME_LIMIT_MINUTES[def.code] ?? 30}
                    onChange={(e) =>
                      setMinutesByDefId((prev) => ({
                        ...prev,
                        [def.id]: Math.max(5, Math.min(240, Number(e.target.value) || 5)),
                      }))
                    }
                    className="w-16 rounded-md border border-gray-300 px-2 py-1 text-right text-xs"
                  />
                  min
                </label>
              )}
            </div>
          );
        })}
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
        {loading ? "Asignando..." : "Asignar evaluación"}
      </button>

      {assigned && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Evaluación(es) asignada(s). El candidato las verá en su panel en cuanto inicie sesión en{" "}
          <span className="font-mono">/candidate/login</span> con las credenciales que le entregaste al crearlo.
          No es necesario enviarle ningún link adicional.
        </div>
      )}
    </div>
  );
}

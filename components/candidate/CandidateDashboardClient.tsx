"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MyAssessmentSummary, MyAssessmentsResponse } from "@/lib/candidate/types";

type LoadState = "loading" | "ready" | "error";

const STATUS_META: Record<
  string,
  { emoji: string; label: string; badgeClass: string }
> = {
  pending: { emoji: "🟡", label: "Pendiente", badgeClass: "bg-yellow-100 text-yellow-800" },
  in_progress: { emoji: "🔵", label: "En progreso", badgeClass: "bg-blue-100 text-blue-800" },
  completed: { emoji: "🟢", label: "Completado ✓", badgeClass: "bg-green-100 text-green-800" },
  expired: { emoji: "🔴", label: "Tiempo agotado", badgeClass: "bg-red-100 text-red-800" },
  revoked: { emoji: "⚪", label: "Anulada", badgeClass: "bg-gray-100 text-gray-600" },
};

export function CandidateDashboardClient() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<MyAssessmentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/candidate/assessments", { cache: "no-store" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudieron cargar tus evaluaciones.");
      setState("error");
      return;
    }
    const body = (await res.json()) as MyAssessmentsResponse;
    setData(body);
    setState("ready");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (state === "loading") {
    return <CenteredMessage title="Cargando..." message="Estamos preparando tu panel." />;
  }

  if (state === "error" || !data) {
    return <CenteredMessage title="No se pudo cargar" message={error ?? "Intenta de nuevo más tarde."} />;
  }

  const { candidate, assessments } = data;
  const totalCount = assessments.length;
  const completedCount = assessments.filter(
    (a) => a.status === "completed" || a.status === "expired",
  ).length;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-indigo-950">Bienvenido, {candidate.full_name}</h1>
        <p className="text-sm text-gray-600">
          Aquí puedes ver y responder las evaluaciones que te fueron asignadas.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <span>Progreso general</span>
          <span>
            {completedCount} de {totalCount} pruebas completadas ({overallPercent}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-indigo-700 transition-all"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {totalCount === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          Todavía no tienes evaluaciones asignadas. Cuando la empresa te asigne alguna, aparecerá aquí.
        </div>
      )}

      <div className="space-y-3">
        {assessments.map((a) => (
          <AssessmentCard key={a.id} assessment={a} onStarted={() => router.push(`/candidate/assessment/${a.id}`)} />
        ))}
      </div>
    </div>
  );
}

function AssessmentCard({
  assessment,
  onStarted,
}: {
  assessment: MyAssessmentSummary;
  onStarted: () => void;
}) {
  const meta = STATUS_META[assessment.status] ?? STATUS_META.pending;
  const percent =
    assessment.total_questions > 0
      ? Math.round((assessment.answered_questions / assessment.total_questions) * 100)
      : 0;
  const isActionable = assessment.status === "pending" || assessment.status === "in_progress";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-indigo-950">{assessment.assessment_name}</p>
          <p className="text-xs text-gray-500">
            {assessment.total_questions} preguntas · {assessment.time_limit_minutes} min de tiempo límite
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${meta.badgeClass}`}>
          {meta.emoji} {meta.label}
        </span>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {assessment.answered_questions} / {assessment.total_questions} preguntas, {percent}%
        </p>
      </div>

      <div className="mt-4">
        {assessment.status === "pending" && (
          <button
            onClick={onStarted}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
          >
            Iniciar
          </button>
        )}
        {assessment.status === "in_progress" && (
          <button
            onClick={onStarted}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
          >
            Continuar
          </button>
        )}
        {!isActionable && (
          <button
            disabled
            className="cursor-not-allowed rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-500"
          >
            {assessment.status === "completed" ? "Completado ✓" : "No disponible"}
          </button>
        )}
      </div>
    </div>
  );
}

function CenteredMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold text-indigo-950">{title}</h1>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

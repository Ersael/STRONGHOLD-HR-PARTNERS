"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnswerJson } from "@/types/database";
import type { PortalAssessment, PortalData } from "@/lib/assessment/types";
import { QuestionRenderer } from "./QuestionRenderer";

type LoadState = "loading" | "ready" | "not_found" | "already_completed";

export function AssessmentPortalClient({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<PortalData | null>(null);
  const [step, setStep] = useState<"personal_info" | "questions">("personal_info");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<PortalData | null> => {
    const res = await fetch(`/api/assessment/${token}`, { cache: "no-store" });
    if (!res.ok) {
      setState("not_found");
      return null;
    }
    const body = (await res.json()) as PortalData;
    setData(body);
    setFullName(body.candidate.full_name ?? "");
    setPhone(body.candidate.phone ?? "");

    const allCompleted = body.assessments.length > 0 && body.assessments.every((a) => a.status === "completed");
    if (allCompleted) {
      setState("already_completed");
      return body;
    }

    setState("ready");
    return body;
  }, [token]);

  useEffect(() => {
    // Carga inicial de los datos del portal (candidato + baterías + preguntas)
    // al montar, a partir del token de la URL. No usamos una librería de
    // data-fetching (React Query/SWR) en esta fase 1, así que el patrón
    // estándar "fetch on mount" dispara el setState dentro de loadData.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const pendingAssessment: PortalAssessment | undefined = useMemo(() => {
    return data?.assessments.find((a) => a.status !== "completed");
  }, [data]);

  const nextQuestion = useMemo(() => {
    if (!pendingAssessment) return undefined;
    const answeredIds = new Set(pendingAssessment.responses.map((r) => r.question_id));
    return [...pendingAssessment.questions]
      .sort((a, b) => a.order_index - b.order_index)
      .find((q) => !answeredIds.has(q.id));
  }, [pendingAssessment]);

  async function handlePersonalInfoSubmit() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/assessment/${token}/personal-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "No se pudo guardar tu información.");
      return;
    }
    setStep("questions");
  }

  async function handleAnswer(answer: AnswerJson) {
    if (!pendingAssessment || !nextQuestion) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/assessment/${token}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_assessment_id: pendingAssessment.id,
        question_id: nextQuestion.id,
        answer,
      }),
    });

    if (!res.ok) {
      setSaving(false);
      const body = await res.json();
      setError(body.error ?? "No se pudo guardar tu respuesta.");
      return;
    }

    const isLastQuestion = pendingAssessment.questions.length === pendingAssessment.responses.length + 1;

    if (isLastQuestion) {
      const completeRes = await fetch(`/api/assessment/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_assessment_id: pendingAssessment.id }),
      });

      if (!completeRes.ok) {
        setSaving(false);
        const body = await completeRes.json();
        setError(body.error ?? "No se pudo finalizar la batería.");
        return;
      }
    }

    const refreshed = await loadData();
    setSaving(false);

    if (isLastQuestion) {
      const stillPending = refreshed?.assessments.some(
        (a) => a.id !== pendingAssessment.id && a.status !== "completed",
      );
      if (!stillPending) {
        router.push(`/assessment/${token}/gracias`);
      }
    }
  }

  if (state === "loading") {
    return <CenteredMessage title="Cargando..." message="Estamos preparando tu evaluación." />;
  }

  if (state === "not_found") {
    return (
      <CenteredMessage
        title="Link no válido"
        message="Este link de evaluación no existe, expiró o ya fue utilizado por completo. Contacta a la persona que te lo compartió si crees que esto es un error."
      />
    );
  }

  if (state === "already_completed") {
    return (
      <CenteredMessage
        title="Evaluación ya completada"
        message="Ya has completado todas las evaluaciones asignadas con este link. No es necesario hacer nada más; gracias por tu tiempo."
      />
    );
  }

  if (!data) return null;

  if (step === "personal_info") {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <h1 className="text-xl font-bold text-indigo-950">Antes de comenzar</h1>
        <p className="text-sm text-gray-600">Confirma o completa tu información de contacto.</p>

        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nombre completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Teléfono</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handlePersonalInfoSubmit}
            disabled={saving || fullName.trim().length < 2}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Continuar"}
          </button>
        </div>
      </div>
    );
  }

  if (!pendingAssessment || !nextQuestion) {
    return <CenteredMessage title="Todo listo" message="Estamos guardando tu progreso..." />;
  }

  const answeredCount = pendingAssessment.responses.length;
  const totalCount = pendingAssessment.questions.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          {pendingAssessment.assessment_name}
        </p>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-indigo-700 transition-all"
            style={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Pregunta {answeredCount + 1} de {totalCount}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <QuestionRenderer question={nextQuestion} onAnswer={handleAnswer} saving={saving} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
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

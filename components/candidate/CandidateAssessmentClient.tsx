"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnswerJson } from "@/types/database";
import type { AssessmentDetail, AssessmentDetailResponse, CandidateQuestion } from "@/lib/candidate/types";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";

type LoadState = "loading" | "ready" | "not_found" | "error";

const WARNING_THRESHOLD_SECONDS = 5 * 60; // 5 minutos: el cronómetro cambia a color de alerta

export function CandidateAssessmentClient({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>("loading");
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // offset = tiempo del SERVIDOR menos Date.now() del navegador, calculado
  // una vez por cada carga a partir de `server_time` (nunca se usa
  // Date.now() puro para decidir cuánto tiempo queda, solo para el "tick"
  // visual entre sincronizaciones — así un reloj local adelantado/atrasado
  // no afecta el cálculo real).
  const serverOffsetRef = useRef<number>(0);
  const expiresAtMsRef = useRef<number | null>(null);
  const checkingExpirationRef = useRef(false);

  // Reintento simple de guardado ante pérdida de conexión: si un POST
  // falla por red, se guarda aquí y se reintenta automáticamente en cuanto
  // el navegador reporta "online" de nuevo.
  const pendingRetryRef = useRef<(() => void) | null>(null);

  function applyServerTime(serverTimeIso: string) {
    serverOffsetRef.current = new Date(serverTimeIso).getTime() - Date.now();
  }

  const load = useCallback(async (): Promise<AssessmentDetail | null> => {
    const res = await fetch(`/api/candidate/assessments/${assessmentId}`, { cache: "no-store" });

    if (res.status === 404) {
      setState("not_found");
      return null;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErrorMsg(body.error ?? "No se pudo cargar la evaluación.");
      setState("error");
      return null;
    }

    const body = (await res.json()) as AssessmentDetailResponse;
    applyServerTime(body.server_time);
    setAssessment(body.assessment);

    const totalQuestions = body.assessment.questions.length;
    const safeIndex = totalQuestions > 0
      ? Math.min(body.assessment.current_question_index ?? 0, totalQuestions - 1)
      : 0;
    setCurrentIndex(safeIndex);

    expiresAtMsRef.current =
      body.assessment.status === "in_progress" && body.assessment.expires_at
        ? new Date(body.assessment.expires_at).getTime()
        : null;

    setState("ready");
    return body.assessment;
  }, [assessmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Cronómetro visible: se actualiza cada segundo en el cliente entre
  // sincronizaciones. Al llegar a 00:00, el cliente NUNCA decide por sí
  // mismo que la prueba expiró: solo dispara `load()` (GET detail), que en
  // el servidor confirma el vencimiento real contra `expires_at` y ejecuta
  // el flujo de expiración (ver supabase/migrations_v2.sql).
  useEffect(() => {
    if (!assessment || assessment.status !== "in_progress" || expiresAtMsRef.current === null) {
      setSecondsLeft(null);
      return;
    }

    function tick() {
      const nowServerMs = Date.now() + serverOffsetRef.current;
      const remainingMs = (expiresAtMsRef.current as number) - nowServerMs;
      const remaining = Math.max(0, Math.floor(remainingMs / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0 && !checkingExpirationRef.current) {
        checkingExpirationRef.current = true;
        load().finally(() => {
          checkingExpirationRef.current = false;
        });
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.status, assessment?.expires_at]);

  useEffect(() => {
    function handleOnline() {
      if (pendingRetryRef.current) {
        const retry = pendingRetryRef.current;
        pendingRetryRef.current = null;
        retry();
      }
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  async function handleStart() {
    setStarting(true);
    setErrorMsg(null);
    const res = await fetch(`/api/candidate/assessments/${assessmentId}/start`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.server_time) {
      applyServerTime(body.server_time);
    }
    if (!res.ok && body.error && body.error !== "already_in_progress") {
      setErrorMsg("No se pudo iniciar la evaluación. Intenta de nuevo.");
    }
    await load();
    setStarting(false);
  }

  const sortedQuestions = useMemo(() => {
    if (!assessment) return [];
    return [...assessment.questions].sort((a, b) => a.order_index - b.order_index);
  }, [assessment]);

  const answeredCount = assessment?.responses.length ?? 0;
  const totalQuestions = sortedQuestions.length;
  const allAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;
  const currentQuestion: CandidateQuestion | undefined = sortedQuestions[currentIndex];

  async function persistAnswer(question: CandidateQuestion, answer: AnswerJson, nextIndex: number) {
    setSaving(true);
    setErrorMsg(null);

    async function attempt() {
      return fetch(`/api/candidate/assessments/${assessmentId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          answer,
          current_question_index: nextIndex,
        }),
      });
    }

    let res: Response;
    try {
      res = await attempt();
    } catch {
      pendingRetryRef.current = () => persistAnswer(question, answer, nextIndex);
      setErrorMsg("Sin conexión a internet. Tu respuesta se reintentará automáticamente al reconectar.");
      setSaving(false);
      return;
    }

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (body.error === "expired") {
        await load();
      } else {
        setErrorMsg(body.error ?? "No se pudo guardar tu respuesta.");
      }
      setSaving(false);
      return;
    }

    if (body.server_time) applyServerTime(body.server_time);
    setSaving(false);
  }

  async function handleAnswer(answer: AnswerJson) {
    if (!currentQuestion) return;

    setAssessment((prev) => {
      if (!prev) return prev;
      const existingIdx = prev.responses.findIndex((r) => r.question_id === currentQuestion.id);
      const nextResponses = [...prev.responses];
      if (existingIdx >= 0) {
        nextResponses[existingIdx] = { question_id: currentQuestion.id, answer_json: answer };
      } else {
        nextResponses.push({ question_id: currentQuestion.id, answer_json: answer });
      }
      return { ...prev, responses: nextResponses };
    });

    const isLast = currentIndex >= sortedQuestions.length - 1;
    const nextIndex = isLast ? currentIndex : currentIndex + 1;

    await persistAnswer(currentQuestion, answer, nextIndex);

    if (!isLast) {
      setCurrentIndex(nextIndex);
    }
  }

  async function handleFinish() {
    setSaving(true);
    setErrorMsg(null);
    const res = await fetch(`/api/candidate/assessments/${assessmentId}/complete`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      if (body.error === "expired") {
        router.push(`/candidate/assessment/${assessmentId}/gracias`);
        return;
      }
      setErrorMsg(body.error ?? "No se pudo finalizar la evaluación.");
      return;
    }

    router.push(`/candidate/assessment/${assessmentId}/gracias`);
  }

  if (state === "loading") {
    return <CenteredMessage title="Cargando..." message="Estamos preparando tu evaluación." />;
  }

  if (state === "not_found") {
    return (
      <CenteredMessage
        title="No encontrada"
        message="Esta evaluación no existe o no te pertenece. Vuelve a tu panel."
        backLink
      />
    );
  }

  if (state === "error" || !assessment) {
    return (
      <CenteredMessage title="Ocurrió un error" message={errorMsg ?? "Intenta de nuevo más tarde."} backLink />
    );
  }

  if (assessment.status === "completed" || assessment.status === "expired" || assessment.status === "revoked") {
    return (
      <CenteredMessage
        title="Evaluación cerrada"
        message={
          assessment.status === "expired"
            ? "El tiempo para esta evaluación ya se agotó. Tus respuestas guardadas hasta ese momento fueron registradas."
            : assessment.status === "revoked"
              ? "Esta evaluación fue anulada por la empresa. Contacta a la persona que te la asignó si crees que esto es un error."
              : "Ya completaste esta evaluación. Gracias por tu tiempo."
        }
        backLink
      />
    );
  }

  // status === 'pending' -> pantalla previa: NO se auto-inicia nada.
  if (assessment.status === "pending") {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-indigo-950">{assessment.assessment_name}</h1>
          <p className="mt-1 text-sm text-gray-600">{assessment.assessment_description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Preguntas</dt>
              <dd className="font-medium text-gray-800">{assessment.questions.length}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Tiempo límite</dt>
              <dd className="font-medium text-gray-800">{assessment.time_limit_minutes} minutos</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-500">
            El cronómetro comienza a correr en cuanto presiones &quot;Iniciar&quot;. Una vez iniciada, no podrás
            pausar la evaluación.
          </p>
          {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}
          <button
            onClick={handleStart}
            disabled={starting}
            className="mt-5 w-full rounded-md bg-indigo-700 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {starting ? "Iniciando..." : "Iniciar"}
          </button>
        </div>
      </div>
    );
  }

  // status === 'in_progress'
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          {assessment.assessment_name}
        </p>
        <TimerBadge secondsLeft={secondsLeft} />
      </div>

      <div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-indigo-700 transition-all"
            style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {answeredCount} / {totalQuestions} preguntas respondidas
        </p>
      </div>

      {allAnswered ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-gray-700">
            Has respondido todas las preguntas. Presiona &quot;Finalizar&quot; para enviar tus respuestas.
          </p>
          {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}
          <button
            onClick={handleFinish}
            disabled={saving}
            className="mt-4 rounded-md bg-indigo-700 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {saving ? "Enviando..." : "Finalizar"}
          </button>
        </div>
      ) : currentQuestion ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs text-gray-400">
            Pregunta {currentIndex + 1} de {totalQuestions}
          </p>
          <QuestionRenderer question={currentQuestion} onAnswer={handleAnswer} saving={saving} />
        </div>
      ) : (
        <CenteredMessage title="Un momento..." message="Estamos guardando tu progreso." />
      )}

      {errorMsg && !allAnswered && <p className="text-sm text-red-600">{errorMsg}</p>}
    </div>
  );
}

function TimerBadge({ secondsLeft }: { secondsLeft: number | null }) {
  if (secondsLeft === null) return null;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isWarning = secondsLeft <= WARNING_THRESHOLD_SECONDS;

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-mono font-semibold ${
        isWarning ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
      }`}
    >
      ⏱ {label}
    </span>
  );
}

function CenteredMessage({
  title,
  message,
  backLink = false,
}: {
  title: string;
  message: string;
  backLink?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold text-indigo-950">{title}</h1>
      <p className="text-sm text-gray-600">{message}</p>
      {backLink && (
        <a href="/candidate" className="text-sm font-medium text-indigo-700 hover:underline">
          Volver a mi panel
        </a>
      )}
    </div>
  );
}

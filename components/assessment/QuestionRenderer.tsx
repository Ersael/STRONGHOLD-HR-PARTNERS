"use client";

import { useState } from "react";
import type {
  AnswerJson,
  ForcedChoiceQuadOptions,
  Likert5Options,
  MultipleChoiceOptions,
} from "@/types/database";
import type { PortalQuestion } from "@/lib/assessment/types";

const DEFAULT_LIKERT_LABELS = [
  "Muy en desacuerdo",
  "En desacuerdo",
  "Neutral",
  "De acuerdo",
  "Muy de acuerdo",
];

export function QuestionRenderer({
  question,
  onAnswer,
  saving,
}: {
  question: PortalQuestion;
  onAnswer: (answer: AnswerJson) => void;
  saving: boolean;
}) {
  if (question.question_type === "likert5") {
    return <Likert5Question question={question} onAnswer={onAnswer} saving={saving} />;
  }
  if (question.question_type === "multiple_choice") {
    return <MultipleChoiceQuestion question={question} onAnswer={onAnswer} saving={saving} />;
  }
  return <ForcedChoiceQuadQuestion question={question} onAnswer={onAnswer} saving={saving} />;
}

function Likert5Question({
  question,
  onAnswer,
  saving,
}: {
  question: PortalQuestion;
  onAnswer: (answer: AnswerJson) => void;
  saving: boolean;
}) {
  const options = question.options_json as Likert5Options;
  const labels = options.scale_labels ?? DEFAULT_LIKERT_LABELS;

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium text-gray-800">{question.prompt_text}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {labels.map((label, idx) => (
          <button
            key={label}
            disabled={saving}
            onClick={() => onAnswer({ value: (idx + 1) as 1 | 2 | 3 | 4 | 5 })}
            className="rounded-md border border-gray-300 px-3 py-3 text-sm hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultipleChoiceQuestion({
  question,
  onAnswer,
  saving,
}: {
  question: PortalQuestion;
  onAnswer: (answer: AnswerJson) => void;
  saving: boolean;
}) {
  const options = question.options_json as MultipleChoiceOptions;

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium text-gray-800">{question.prompt_text}</p>
      <div className="space-y-2">
        {options.choices.map((choice, idx) => (
          <button
            key={idx}
            disabled={saving}
            onClick={() => onAnswer({ selected_index: idx })}
            className="block w-full rounded-md border border-gray-300 px-4 py-3 text-left text-sm hover:border-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

function ForcedChoiceQuadQuestion({
  question,
  onAnswer,
  saving,
}: {
  question: PortalQuestion;
  onAnswer: (answer: AnswerJson) => void;
  saving: boolean;
}) {
  const options = question.options_json as ForcedChoiceQuadOptions;
  const [mostIndex, setMostIndex] = useState<number | null>(null);
  const [leastIndex, setLeastIndex] = useState<number | null>(null);

  function handleMost(idx: number) {
    setMostIndex(idx);
    if (leastIndex === idx) setLeastIndex(null);
  }

  function handleLeast(idx: number) {
    setLeastIndex(idx);
    if (mostIndex === idx) setMostIndex(null);
  }

  function submit() {
    if (mostIndex === null || leastIndex === null) return;
    onAnswer({ most_index: mostIndex as 0 | 1 | 2 | 3, least_index: leastIndex as 0 | 1 | 2 | 3 });
    setMostIndex(null);
    setLeastIndex(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium text-gray-800">{question.prompt_text}</p>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Frase</th>
              <th className="px-3 py-2 font-medium">MÁS como yo</th>
              <th className="px-3 py-2 font-medium">MENOS como yo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {options.options.map((opt, idx) => (
              <tr key={idx}>
                <td className="px-3 py-3">{opt.text}</td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="radio"
                    name="most"
                    checked={mostIndex === idx}
                    onChange={() => handleMost(idx)}
                    disabled={saving}
                  />
                </td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="radio"
                    name="least"
                    checked={leastIndex === idx}
                    onChange={() => handleLeast(idx)}
                    disabled={saving}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={submit}
        disabled={saving || mostIndex === null || leastIndex === null}
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        Continuar
      </button>
    </div>
  );
}

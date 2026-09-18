"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CredentialsModal } from "@/components/admin/CredentialsModal";

export function CandidateForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [positionApplied, setPositionApplied] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ id: string; email: string; temporaryPassword: string } | null>(
    null,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone: phone || null,
        position_applied: positionApplied || null,
        notes: notes || null,
      }),
    });

    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "No se pudo crear el candidato.");
      return;
    }

    // No navegamos de inmediato: primero mostramos la contraseña temporal
    // generada, que Supabase Auth nunca vuelve a exponer en texto plano.
    setCreated({ id: body.candidate.id, email: body.candidate.email, temporaryPassword: body.temporary_password });
  }

  if (created) {
    return (
      <CredentialsModal
        email={created.email}
        temporaryPassword={created.temporaryPassword}
        onContinue={() => router.push(`/admin/candidates/${created.id}`)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Correo *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Puesto aplicado</label>
        <input
          value={positionApplied}
          onChange={(e) => setPositionApplied(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Crear candidato"}
      </button>
    </form>
  );
}

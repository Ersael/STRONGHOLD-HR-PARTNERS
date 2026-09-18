"use client";

import { useState } from "react";

/**
 * Modal que se muestra UNA SOLA VEZ justo después de crear un candidato,
 * mostrando el email y la contraseña temporal generada por
 * `POST /api/candidates` (campo `temporary_password`). Supabase Auth no
 * vuelve a exponer esa contraseña en texto plano después de este momento
 * (queda hasheada), así que si el admin cierra esta pantalla sin copiarla,
 * la única forma de recuperar el acceso del candidato es restablecer su
 * contraseña manualmente (fuera del alcance de esta fase).
 */
export function CredentialsModal({
  email,
  temporaryPassword,
  onContinue,
}: {
  email: string;
  temporaryPassword: string;
  onContinue: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const portalUrl =
    typeof window !== "undefined" ? `${window.location.origin}/candidate/login` : "/candidate/login";

  function copy(label: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField((current) => (current === label ? null : current)), 1500);
  }

  const message =
    `Ya puedes acceder a tu portal de evaluación:\n${portalUrl}\n\n` +
    `Usuario: ${email}\nContraseña temporal: ${temporaryPassword}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-indigo-950">Candidato creado</h2>
          <p className="mt-1 text-sm text-gray-600">
            Comparte estas credenciales con el candidato por un canal seguro (no por este medio).
          </p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <span className="font-semibold">Guarda esta contraseña ahora: </span>
          no podrás volver a verla. Supabase no la muestra de nuevo una vez cerrada esta pantalla.
        </div>

        <FieldRow label="Usuario (correo)" value={email} copied={copiedField === "email"} onCopy={() => copy("email", email)} />
        <FieldRow
          label="Contraseña temporal"
          value={temporaryPassword}
          copied={copiedField === "password"}
          onCopy={() => copy("password", temporaryPassword)}
          mono
        />
        <FieldRow
          label="Portal del candidato"
          value={portalUrl}
          copied={copiedField === "url"}
          onCopy={() => copy("url", portalUrl)}
        />

        <button
          type="button"
          onClick={() => copy("message", message)}
          className="w-full rounded-md border border-indigo-200 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
        >
          {copiedField === "message" ? "¡Mensaje copiado!" : "Copiar mensaje completo para enviar al candidato"}
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
        >
          Ya la guardé, continuar
        </button>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  copied,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="flex items-center gap-2">
        <code
          className={`flex-1 break-all rounded-md bg-gray-100 px-2 py-2 text-xs text-gray-800 ${mono ? "font-mono" : ""}`}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-md border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

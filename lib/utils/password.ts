import { randomInt } from "crypto";

/**
 * Genera una contraseña temporal legible (para comunicarla manualmente al
 * candidato) pero con suficiente entropía: 3 grupos de 4 caracteres
 * alfanuméricos separados por guiones, ej. "K3F9-QW2M-7ZXA". Usada al crear
 * un candidato (Fase A prepara el soporte de backend; la Fase B construye
 * la UI de admin que la mostrará/copiará) y por
 * `scripts/seed-test-candidate.ts`.
 */
export function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar confusión visual
  const group = () =>
    Array.from({ length: 4 }, () => alphabet[randomInt(0, alphabet.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

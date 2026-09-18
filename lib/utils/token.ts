import { randomBytes } from "crypto";

/**
 * Genera un token de un solo uso, URL-safe, de 32 bytes de entropía
 * (~43 caracteres base64url). Se usa como `unique_token` de
 * `candidate_assessments`. Cuando un admin asigna varias baterías a la
 * vez, todas las filas creadas en ese acto comparten el mismo token para
 * poder compartir un solo link (ver comentario de diseño en
 * supabase/schema.sql).
 */
export function generateAssessmentToken(): string {
  return randomBytes(32).toString("base64url");
}

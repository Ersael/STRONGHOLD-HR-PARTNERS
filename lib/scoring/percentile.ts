import { PLACEHOLDER_NORM } from "@/lib/constants";

/**
 * Aproximación de la función de error (erf) usando el polinomio de
 * Abramowitz & Stegun 7.1.26 (precisión ~1.5e-7). Se usa para derivar la
 * CDF normal sin depender de una librería externa de estadística.
 */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

function normalCdf(x: number, mean: number, stdDev: number): number {
  return 0.5 * (1 + erf((x - mean) / (stdDev * Math.SQRT2)));
}

/**
 * Calcula un percentil "ilustrativo" para un normalized_score (0-100)
 * asumiendo que la población de referencia sigue una distribución normal
 * con media=50 y desviación estándar=15 (PLACEHOLDER_NORM).
 *
 * IMPORTANTE: esto NO es una norma poblacional real. No existe un estudio
 * de baremación detrás. Es solo un recurso ilustrativo para presentar un
 * número "tipo percentil" en el reporte, consistente con el aviso ético
 * de la plataforma (ver lib/constants.ts -> ETHICAL_NOTICE).
 */
export function calculateIllustrativePercentile(normalizedScore: number): number {
  const { mean, stdDev } = PLACEHOLDER_NORM;
  const p = normalCdf(normalizedScore, mean, stdDev) * 100;
  return Math.round(Math.min(99, Math.max(1, p)));
}

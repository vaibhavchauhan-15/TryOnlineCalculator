// Unit-normalisation constants + helpers shared by pure engines.
//
// Engines always compute in SI (kg, cm) and emit raw SI values tagged with a
// `mass`/`length` format. Which system the visitor SEES (metric vs imperial) is
// a *preference*, resolved by the localization layer at render time — so the
// engine never bakes a display unit into its output.

export const LB_TO_KG = 0.45359237;
export const IN_TO_CM = 2.54;

/** feet + inches → centimetres. */
export function ftInToCm(ft: number, inch: number): number {
  return (ft * 12 + inch) * IN_TO_CM;
}

/** pounds → kilograms. */
export function lbToKg(lb: number): number {
  return lb * LB_TO_KG;
}

export function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/**
 * Lenient string→number coercion for raw form values. Strips grouping commas
 * and stray spaces so "1,200" and " 1200 " both parse. Returns `fallback`
 * (default 0) for empty/non-numeric input so compute()/validate() stay in
 * control of what counts as invalid.
 */
export function num(raw: string | undefined, fallback = 0): number {
  if (raw === undefined) return fallback;
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return fallback;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

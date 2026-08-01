// Shared financial + numeric helpers for compute functions.

/** Level payment for an amortizing loan. rate = periodic rate, nper = periods, pv = present value. */
export function pmt(rate: number, nper: number, pv: number): number {
  if (!Number.isFinite(pv) || !Number.isFinite(rate) || !Number.isFinite(nper)) return NaN;
  if (nper <= 0) return NaN;
  if (pv === 0) return 0;
  if (rate === 0) return pv / nper;
  if (rate <= -1) return NaN;
  
  // Use expm1 and log1p for high floating-point precision on small interest rates
  const denom = -Math.expm1(-nper * Math.log1p(rate));
  if (denom === 0 || !Number.isFinite(denom)) return NaN;
  return (pv * rate) / denom;
}

/** Future value of a present sum plus a recurring end-of-period contribution. */
export function futureValue(rate: number, nper: number, pmtAmt: number, pv: number): number {
  if (!Number.isFinite(rate) || !Number.isFinite(nper) || !Number.isFinite(pmtAmt) || !Number.isFinite(pv)) return NaN;
  if (rate === 0) return pv + pmtAmt * nper;
  if (rate <= -1) return NaN;
  
  const growth = Math.pow(1 + rate, nper);
  if (!Number.isFinite(growth)) return NaN;
  
  const pmtPart = pmtAmt * (Math.expm1(nper * Math.log1p(rate)) / rate);
  return pv * growth + pmtPart;
}

/** Solve for the periodic rate of a loan given payment, periods and principal (Newton's method). */
export function solveRate(nper: number, pmtAmt: number, pv: number): number {
  if (!Number.isFinite(nper) || !Number.isFinite(pmtAmt) || !Number.isFinite(pv)) return NaN;
  if (nper <= 0 || pv <= 0 || pmtAmt <= 0) return NaN;
  let r = 0.01; // initial guess: 1% per period
  for (let i = 0; i < 200; i++) {
    const pow = Math.pow(1 + r, -nper);
    if (!Number.isFinite(pow)) break;
    const f = pv * r - pmtAmt * (1 - pow);
    const dfdr = pv - pmtAmt * (nper * Math.pow(1 + r, -nper - 1));
    if (dfdr === 0) break; // avoid division by zero in Newton step
    const next = r - f / dfdr;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - r) < 1e-10) return next;
    r = next <= -1 ? -0.9999 : next;
  }
  return r;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}


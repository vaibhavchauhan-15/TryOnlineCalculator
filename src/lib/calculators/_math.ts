// Shared financial + numeric helpers for compute functions.

/** Level payment for an amortizing loan. rate = periodic rate, nper = periods, pv = present value. */
export function pmt(rate: number, nper: number, pv: number): number {
  if (nper <= 0) return NaN;
  if (rate === 0) return pv / nper;
  return (pv * rate) / (1 - Math.pow(1 + rate, -nper));
}

/** Future value of a present sum plus a recurring end-of-period contribution. */
export function futureValue(rate: number, nper: number, pmtAmt: number, pv: number): number {
  if (rate === 0) return pv + pmtAmt * nper;
  const growth = Math.pow(1 + rate, nper);
  return pv * growth + pmtAmt * ((growth - 1) / rate);
}

/** Solve for the periodic rate of a loan given payment, periods and principal (Newton's method). */
export function solveRate(nper: number, pmtAmt: number, pv: number): number {
  let r = 0.01; // initial guess: 1% per period
  for (let i = 0; i < 100; i++) {
    const f = pv * r - pmtAmt * (1 - Math.pow(1 + r, -nper));
    const dfdr =
      pv - pmtAmt * (nper * Math.pow(1 + r, -nper - 1));
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

// Tiny, shared haptic-feedback helper used across every calculator.
//
// Design goals mirror the rest of the engine:
//   * Subtle  — vibrations are single, very short pulses (8–18ms). Never a
//               buzzing pattern; the goal is a barely-there tactile "tick".
//   * Safe    — the Vibration API only exists on some devices (mostly Android
//               Chrome; iOS Safari has no support and simply ignores it). Every
//               call is feature-detected and wrapped so it can never throw and
//               is a no-op during SSR.
//   * Polite  — respects `prefers-reduced-motion`. A user who asks for reduced
//               motion is also asking for a calmer, non-buzzing experience, so
//               we suppress haptics entirely for them.
//
// Usage: import { haptic } from './haptics'; haptic.tap();  haptic.success();

type Pattern = number | number[];

// Resolve capability + reduced-motion lazily so this module is import-safe on
// the server and cheap on the client. The reduced-motion query is read live
// (not cached) so a mid-session OS change is respected.
function canVibrate(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.vibrate !== 'function') return false;
  try {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return true;
  }
}

function fire(pattern: Pattern): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* some browsers throw if called without a user gesture — ignore */
  }
}

export const haptic = {
  /** A light tick — for a key press, tab switch or unit change. */
  tap(): void {
    fire(8);
  },
  /** A slightly firmer tick — for a committed action (Calculate / Convert). */
  medium(): void {
    fire(12);
  },
  /** A short double pulse acknowledging success (equals, copy, saved). */
  success(): void {
    fire([10, 40, 14]);
  },
  /** A firmer single pulse for an error / invalid input. */
  error(): void {
    fire(24);
  },
};

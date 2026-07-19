// Pluggable translation layer for the localization CLI (Task 11).
//
// The CLI never talks to a specific model — it talks to this `Translator`
// interface, so a production run can swap in an LLM/DeepL/Google adapter with
// zero changes elsewhere. Shipped here:
//   * DictionaryTranslator — an OFFLINE, deterministic translator driven by
//     per-locale glossaries. It gives real translations for the high-value
//     surfaces (titles, chrome, units, core labels/enums) and passes the long
//     tail through untouched (English), which is exactly how a review-gated
//     pipeline behaves before human review.
//   * IdentityTranslator — passthrough, for tests / dry runs.
//
// Every translator MUST honour the protection rules: placeholders like
// `{from}`, numbers, and do-not-translate terms (BMI, GPA, APR, currency codes…)
// are never altered. Protection is enforced here (not per-adapter) so it can
// never be forgotten.

export interface TranslateRequest {
  /** The English source strings. */
  texts: string[];
  targetLocale: string;
}

export interface Translator {
  /** Stable id stamped into MDX `model` for provenance. */
  readonly id: string;
  translate(req: TranslateRequest): Promise<string[]>;
}

export interface Glossary {
  /** Whole-string matches (case-insensitive), highest priority. */
  phrases: Record<string, string>;
  /** Token-level fallback substitutions (case-insensitive whole words). */
  words: Record<string, string>;
}

// Terms that must survive translation verbatim (acronyms, brand-ish product
// names, ISO currency codes). Shared across all locales.
export const DO_NOT_TRANSLATE = new Set<string>([
  'BMI', 'BMR', 'TDEE', 'GPA', 'APR', 'SIP', 'MPG', 'FICA', 'PITI', 'US',
]);

const CURRENCY_CODE_RE = /^[A-Z]{3}$/;
const PLACEHOLDER_RE = /\{[^}]+\}/g;

/** A term is protected if it's a do-not-translate acronym or an ISO code. */
export function isProtectedToken(token: string): boolean {
  return DO_NOT_TRANSLATE.has(token) || CURRENCY_CODE_RE.test(token);
}

/**
 * Split a string into segments, isolating {placeholders} so they are never
 * translated. Returns alternating text / placeholder chunks with a flag.
 */
export function segmentPlaceholders(text: string): { text: string; protectedChunk: boolean }[] {
  const out: { text: string; protectedChunk: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    const idx = m.index!;
    if (idx > last) out.push({ text: text.slice(last, idx), protectedChunk: false });
    out.push({ text: m[0], protectedChunk: true });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), protectedChunk: false });
  return out.length ? out : [{ text, protectedChunk: false }];
}

/** Preserve the capitalization shape of `src` onto `dst` (Title / lower). */
function matchCase(src: string, dst: string): string {
  if (!src || !dst) return dst;
  if (src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase()) {
    return dst[0].toUpperCase() + dst.slice(1);
  }
  return dst;
}

export class DictionaryTranslator implements Translator {
  readonly id: string;
  constructor(private readonly glossaries: Record<string, Glossary>, idSuffix = 'v1') {
    this.id = `offline-dictionary-${idSuffix}`;
  }

  async translate(req: TranslateRequest): Promise<string[]> {
    const g = this.glossaries[req.targetLocale];
    if (!g) return [...req.texts]; // no glossary → passthrough (English)
    return req.texts.map((t) => this.translateOne(t, g));
  }

  private translateOne(text: string, g: Glossary): string {
    const trimmed = text.trim();
    if (!trimmed) return text;

    // 1) Whole-string phrase match wins (best quality; handles titles + idioms).
    const phrase = g.phrases[trimmed.toLowerCase()];
    if (phrase !== undefined) return phrase;

    // 2) Token-level fallback, placeholder-safe and protection-safe.
    return segmentPlaceholders(text)
      .map((seg) => (seg.protectedChunk ? seg.text : this.translateWords(seg.text, g)))
      .join('');
  }

  private translateWords(chunk: string, g: Glossary): string {
    // Keep separators (spaces, punctuation) intact; only remap word tokens.
    return chunk.replace(/[A-Za-z][A-Za-z'-]*|\d+(?:[.,]\d+)?/g, (token) => {
      if (isProtectedToken(token)) return token; // acronyms / codes
      if (/^\d/.test(token)) return token; // numbers
      const hit = g.words[token.toLowerCase()];
      return hit ? matchCase(token, hit) : token;
    });
  }
}

export class IdentityTranslator implements Translator {
  readonly id = 'identity';
  async translate(req: TranslateRequest): Promise<string[]> {
    return [...req.texts];
  }
}

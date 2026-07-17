import type { MatchResult, NoteProfile } from "./types";

// Weighted note similarity: the dry-down (base notes) defines what a perfume
// "smells like" long-term, so base notes count most, then heart, then top.
const LEVEL_WEIGHTS = { base: 3, middle: 2, top: 1 } as const;

const NOTES_WEIGHT = 0.6;
const ACCORDS_WEIGHT = 0.4;

export function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

function noteWeights(profile: NoteProfile): Map<string, number> {
  const weights = new Map<string, number>();
  const add = (notes: string[], weight: number) => {
    for (const raw of notes) {
      const note = normalizeTerm(raw);
      if (!note) continue;
      weights.set(note, Math.max(weights.get(note) ?? 0, weight));
    }
  };
  add(profile.base_notes, LEVEL_WEIGHTS.base);
  add(profile.middle_notes, LEVEL_WEIGHTS.middle);
  add(profile.top_notes, LEVEL_WEIGHTS.top);
  return weights;
}

/** Weighted Jaccard over the note pyramids of two perfumes (0..1). */
export function noteSimilarity(a: NoteProfile, b: NoteProfile): number {
  const wa = noteWeights(a);
  const wb = noteWeights(b);
  if (wa.size === 0 || wb.size === 0) return 0;

  let intersection = 0;
  let union = 0;
  const all = new Set([...wa.keys(), ...wb.keys()]);
  for (const note of all) {
    const x = wa.get(note) ?? 0;
    const y = wb.get(note) ?? 0;
    intersection += Math.min(x, y);
    union += Math.max(x, y);
  }
  return union === 0 ? 0 : intersection / union;
}

// Accords are stored ordered by prominence; earlier accords carry more weight.
function accordVector(accords: string[]): Map<string, number> {
  const vec = new Map<string, number>();
  accords.forEach((raw, i) => {
    const accord = normalizeTerm(raw);
    if (!accord || vec.has(accord)) return;
    vec.set(accord, 1 / (i + 1));
  });
  return vec;
}

/** Cosine similarity between rank-weighted accord vectors (0..1). */
export function accordSimilarity(a: string[], b: string[]): number {
  const va = accordVector(a);
  const vb = accordVector(b);
  if (va.size === 0 || vb.size === 0) return 0;

  let dot = 0;
  for (const [accord, x] of va) {
    const y = vb.get(accord);
    if (y) dot += x * y;
  }
  const norm = (v: Map<string, number>) =>
    Math.sqrt([...v.values()].reduce((sum, x) => sum + x * x, 0));
  const denominator = norm(va) * norm(vb);
  return denominator === 0 ? 0 : dot / denominator;
}

function sharedTerms(a: string[], b: string[]): string[] {
  const setB = new Set(b.map(normalizeTerm));
  const seen = new Set<string>();
  const shared: string[] = [];
  for (const raw of a) {
    const key = normalizeTerm(raw);
    if (setB.has(key) && !seen.has(key)) {
      seen.add(key);
      shared.push(raw);
    }
  }
  return shared;
}

function allNotes(p: NoteProfile): string[] {
  return [...p.base_notes, ...p.middle_notes, ...p.top_notes];
}

/**
 * Overall similarity between two perfumes: 60% weighted note overlap,
 * 40% accord cosine. If either side lacks accord data, notes decide alone.
 */
export function matchProfiles(a: NoteProfile, b: NoteProfile): MatchResult {
  const notes = noteSimilarity(a, b);
  const hasAccords = a.accords.length > 0 && b.accords.length > 0;
  const accords = hasAccords ? accordSimilarity(a.accords, b.accords) : 0;
  const score = hasAccords
    ? NOTES_WEIGHT * notes + ACCORDS_WEIGHT * accords
    : notes;

  return {
    score,
    sharedNotes: sharedTerms(allNotes(a), allNotes(b)),
    sharedAccords: hasAccords ? sharedTerms(a.accords, b.accords) : [],
  };
}

export function scoreAsPercent(score: number): number {
  return Math.round(Math.min(1, score) * 100);
}

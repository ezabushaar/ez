import {
  getAllFragrances,
  getEffectiveProfile,
  getFragrance,
  listProducts,
} from "./db";
import { matchProfiles, scoreAsPercent } from "./similarity";
import type { Fragrance, MarsaProduct } from "./types";

export interface ProductMatch {
  product: MarsaProduct;
  percent: number;
  sharedNotes: string[];
  sharedAccords: string[];
}

export interface FragranceMatch {
  fragrance: Fragrance;
  percent: number;
  sharedNotes: string[];
  sharedAccords: string[];
}

/** Marsa products ranked by similarity to the target perfume. */
export function matchProducts(fragranceId: number, limit = 8): ProductMatch[] {
  const target = getFragrance(fragranceId);
  if (!target) return [];

  const matches: ProductMatch[] = [];
  for (const product of listProducts()) {
    const profile = getEffectiveProfile(product.id);
    if (!profile) continue;
    const result = matchProfiles(target, profile);
    if (result.score <= 0) continue;
    matches.push({
      product,
      percent: scoreAsPercent(result.score),
      sharedNotes: result.sharedNotes,
      sharedAccords: result.sharedAccords,
    });
  }
  return matches.sort((a, b) => b.percent - a.percent).slice(0, limit);
}

/** Other perfumes in the database ranked by similarity to the target. */
export function matchFragrances(
  fragranceId: number,
  limit = 10,
): FragranceMatch[] {
  const target = getFragrance(fragranceId);
  if (!target) return [];

  const matches: FragranceMatch[] = [];
  for (const candidate of getAllFragrances()) {
    if (candidate.id === fragranceId) continue;
    const result = matchProfiles(target, candidate);
    if (result.score <= 0.05) continue;
    matches.push({
      fragrance: candidate,
      percent: scoreAsPercent(result.score),
      sharedNotes: result.sharedNotes,
      sharedAccords: result.sharedAccords,
    });
  }
  return matches.sort((a, b) => b.percent - a.percent).slice(0, limit);
}

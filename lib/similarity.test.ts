import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  accordSimilarity,
  matchProfiles,
  noteSimilarity,
  scoreAsPercent,
} from "./similarity";
import type { NoteProfile } from "./types";

const starter: (NoteProfile & { brand: string; name: string })[] = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "data", "starter-fragrances.json"),
    "utf-8",
  ),
);

function find(brand: string, name: string) {
  const fragrance = starter.find((f) => f.brand === brand && f.name === name);
  if (!fragrance) throw new Error(`Missing starter fragrance: ${brand} ${name}`);
  return fragrance;
}

describe("noteSimilarity", () => {
  it("is 1 for identical profiles", () => {
    const br540 = find("Maison Francis Kurkdjian", "Baccarat Rouge 540");
    expect(noteSimilarity(br540, br540)).toBe(1);
  });

  it("is 0 when there is no overlap", () => {
    const a: NoteProfile = {
      top_notes: ["lemon"],
      middle_notes: ["rose"],
      base_notes: ["musk"],
      accords: [],
    };
    const b: NoteProfile = {
      top_notes: ["pear"],
      middle_notes: ["jasmine"],
      base_notes: ["vanilla"],
      accords: [],
    };
    expect(noteSimilarity(a, b)).toBe(0);
  });

  it("normalizes case and parentheticals", () => {
    const a: NoteProfile = {
      top_notes: [],
      middle_notes: [],
      base_notes: ["Agarwood (Oud)"],
      accords: [],
    };
    const b: NoteProfile = {
      top_notes: [],
      middle_notes: [],
      base_notes: ["agarwood"],
      accords: [],
    };
    expect(noteSimilarity(a, b)).toBe(1);
  });
});

describe("accordSimilarity", () => {
  it("weights leading accords more heavily", () => {
    const sameLead = accordSimilarity(
      ["vanilla", "sweet", "woody"],
      ["vanilla", "amber", "fresh"],
    );
    const sameTail = accordSimilarity(
      ["vanilla", "sweet", "woody"],
      ["amber", "fresh", "vanilla"],
    );
    expect(sameLead).toBeGreaterThan(sameTail);
  });

  it("returns 0 with no shared accords", () => {
    expect(accordSimilarity(["citrus"], ["leather"])).toBe(0);
  });
});

describe("known dupe pairs score higher than dissimilar pairs", () => {
  const cases: Array<[string, string, string, string]> = [
    ["Creed|Aventus", "Armaf|Club de Nuit Intense Man", "Chanel|No 5", ""],
    [
      "Kilian|Angels' Share",
      "Lattafa|Khamrah",
      "Giorgio Armani|Acqua di Gio",
      "",
    ],
    [
      "Ariana Grande|Cloud",
      "Lattafa|Yara",
      "Paco Rabanne|Invictus",
      "",
    ],
  ];

  for (const [targetKey, dupeKey, controlKey] of cases) {
    const [tb, tn] = targetKey.split("|");
    const [db, dn] = dupeKey.split("|");
    const [cb, cn] = controlKey.split("|");
    it(`${tn} ~ ${dn} > ${tn} ~ ${cn}`, () => {
      const target = find(tb, tn);
      const dupe = find(db, dn);
      const control = find(cb, cn);
      const dupeScore = matchProfiles(target, dupe).score;
      const controlScore = matchProfiles(target, control).score;
      expect(dupeScore).toBeGreaterThan(controlScore);
      expect(dupeScore).toBeGreaterThan(0.3);
    });
  }
});

describe("matchProfiles", () => {
  it("returns shared notes and accords", () => {
    const aventus = find("Creed", "Aventus");
    const cdnim = find("Armaf", "Club de Nuit Intense Man");
    const result = matchProfiles(aventus, cdnim);
    const sharedLower = result.sharedNotes.map((n) => n.toLowerCase());
    expect(sharedLower).toContain("pineapple");
    expect(sharedLower).toContain("birch");
    expect(result.sharedAccords.map((a) => a.toLowerCase())).toContain("smoky");
  });

  it("falls back to note similarity when accords are missing", () => {
    const a: NoteProfile = {
      top_notes: ["lemon"],
      middle_notes: ["rose"],
      base_notes: ["musk"],
      accords: [],
    };
    const result = matchProfiles(a, a);
    expect(result.score).toBe(1);
    expect(result.sharedAccords).toEqual([]);
  });
});

describe("scoreAsPercent", () => {
  it("rounds and clamps", () => {
    expect(scoreAsPercent(0.847)).toBe(85);
    expect(scoreAsPercent(1.4)).toBe(100);
    expect(scoreAsPercent(0)).toBe(0);
  });
});

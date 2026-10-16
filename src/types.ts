export interface Character {
  reference: string;
  name: { en: string; fr: string };
  faction: string;
  factionName: string;
  set: string;
  setName: string;
  type: string;
}

export type Lang = "en" | "fr";

/** 0 a high-contrast blurred 4×3 cell, 1 the closest 3×3 cell in grayscale, 2 the closest 2×3 cell in color, 3 the closest 2×2 cell. */
export type HintStep = 0 | 1 | 2 | 3;

export interface Stats {
  score: number;
  solved: number;
  streak: number;
  lastPlayed: string;
}

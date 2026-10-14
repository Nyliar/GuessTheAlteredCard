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

/** 0 black silhouette, 1 the same detail in grayscale, 2 a larger color detail, 3 a wider crop of the art. */
export type HintStep = 0 | 1 | 2 | 3;

export interface Stats {
  score: number;
  solved: number;
  streak: number;
  lastPlayed: string;
}

import type { Lang } from "./types";

const TYPES: Record<Lang, Record<string, string>> = {
  en: {},
  fr: {
    Character: "Personnage",
    Spell: "Sort",
    Permanent: "Permanent",
    "Landmark Permanent": "Permanent de Repère",
    "Expedition Permanent": "Permanent d'Expédition",
    Hero: "Héros",
    "Token Character": "Jeton Personnage",
    "Token Landmark Permanent": "Jeton Repère Permanent",
    Mana: "Mana",
  },
};

const SETS: Record<string, string> = {
  CORE: "Au-delà des portes",
  ALIZE: "Épreuve du froid",
  BISE: "Murmures du Labyrinthe",
  CYCLONE: "Odyssée des cieux",
  DUSTER: "Les Graines de l'Unité",
  EOLE: "Les Racines de la Corruption",
  FUGUE: "La Traversée Éternelle",
};

export function typeLabel(type: string, lang: Lang): string {
  return lang === "fr" ? TYPES.fr[type] ?? type : type;
}

export function factionLabel(name: string, lang: Lang): string {
  if (lang === "fr" && name === "Neutral") return "Neutre";
  return name;
}

export function setLabel(code: string, englishName: string, lang: Lang): string {
  return lang === "fr" ? SETS[code] ?? englishName : englishName;
}

import { normalizeLoose } from "./guess";
import type { Character, Lang } from "./types";

export interface NameSuggestion {
  name: string;
  reference: string;
}

/** Same cap as Alteredle: the first five matches. */
export const SUGGESTION_LIMIT = 5;

/** Cards whose displayed name matches the typed query, closest first. */
export function suggestNames(
  cards: Character[],
  lang: Lang,
  query: string,
  limit = SUGGESTION_LIMIT,
): NameSuggestion[] {
  const needle = normalizeLoose(query);
  if (!needle) return [];

  const ranked: { name: string; reference: string; rank: number }[] = [];
  for (const card of uniqueNames(cards, lang)) {
    const rank = matchRank(normalizeLoose(card.name), needle);
    if (rank < 0) continue;
    ranked.push({ ...card, rank });
  }

  const locale = lang === "fr" ? "fr" : "en";
  ranked.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, locale));
  return ranked.slice(0, limit).map(({ name, reference }) => ({ name, reference }));
}

function uniqueNames(cards: Character[], lang: Lang): NameSuggestion[] {
  const seen = new Set<string>();
  const names: NameSuggestion[] = [];
  for (const card of cards) {
    const name = lang === "fr" ? card.name.fr : card.name.en;
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push({ name, reference: card.reference });
  }
  return names;
}

function matchRank(hay: string, needle: string): number {
  if (hay === needle) return 0;
  if (hay.startsWith(needle)) return 1;
  if (hay.split(" ").some((word) => word.startsWith(needle))) return 2;
  if (hay.includes(needle)) return 3;
  return -1;
}

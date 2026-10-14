import type { Character, Lang } from "./types";

export function namesFor(cards: Character[], lang: Lang): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const card of cards) {
    const name = lang === "fr" ? card.name.fr : card.name.en;
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  names.sort((a, b) => a.localeCompare(b, lang === "fr" ? "fr" : "en"));
  return names;
}

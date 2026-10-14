import config from "./sets.json";

export interface SetOption {
  code: string;
  enabled: boolean;
}

/** Playable sets. FUGUE is Neverending Journey and stays off until it should join the pool. */
export const SETS: SetOption[] = config.sets;

const enabled = new Set(SETS.filter((set) => set.enabled).map((set) => set.code));

export function cardsInPool<T extends { set: string }>(cards: readonly T[]): T[] {
  return cards.filter((card) => enabled.has(card.set));
}

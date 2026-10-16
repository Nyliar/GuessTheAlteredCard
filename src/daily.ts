import type { Character, HintStep, Stats } from "./types";

export interface DailyRecord {
  date: string;
  reference: string;
  step: HintStep;
  phase: "playing" | "correct" | "miss";
  awarded: number | null;
  hints: number;
  /** The first crop was skipped, so a share marks that step as missed. */
  skippedFirst: boolean;
}

export function dayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function previousDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return dayKey(new Date(year, month - 1, date - 1));
}

const PRINT_RANK: Record<string, number> = { C: 0, E: 1, R1: 2, R2: 3 };

/** One puzzle per character. Alternate printings share a name, so the common art represents them. */
export function oneOfEachCharacter<T extends { reference: string }>(cards: readonly T[]): T[] {
  const chosen = new Map<string, T>();
  for (const card of cards) {
    const id = characterId(card.reference);
    const current = chosen.get(id);
    if (!current || printRank(card.reference) < printRank(current.reference)) chosen.set(id, card);
  }
  return [...chosen.values()];
}

export function cardForDay(cards: readonly Character[], day: string): Character {
  if (cards.length === 0) throw new Error("No cards");
  return cards[hash(day) % cards.length];
}

function characterId(reference: string): string {
  return reference.replace(/_(C|E|R1|R2)$/, "");
}

function printRank(reference: string): number {
  const suffix = reference.split("_").pop() ?? "";
  return PRINT_RANK[suffix] ?? 4;
}

export function applyResult(stats: Stats, points: number, today: string, oncePerDay = true, correct = false): Stats {
  if (oncePerDay && stats.lastPlayed === today) return stats;
  return {
    score: stats.score + points,
    solved: stats.solved + (correct ? 1 : 0),
    streak: correct ? stats.streak + 1 : 0,
    lastPlayed: today,
  };
}

export function msUntilNextDay(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}H ${String(minutes).padStart(2, "0")}M ${String(seconds).padStart(2, "0")}S`;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}


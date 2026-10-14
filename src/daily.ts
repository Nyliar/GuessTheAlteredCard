import type { Character, HintStep, Stats } from "./types";

export interface DailyRecord {
  date: string;
  reference: string;
  step: HintStep;
  phase: "playing" | "correct" | "miss";
  awarded: number | null;
  hints: number;
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

export function cardForDay(cards: readonly Character[], day: string): Character {
  if (cards.length === 0) throw new Error("No cards");
  return cards[hash(day) % cards.length];
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
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

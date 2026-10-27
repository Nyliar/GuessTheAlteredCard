import type { DailyRecord } from "./daily";
import { normalizeHints } from "./hints";
import { EMPTY_LOG, normalizeLog, type GameResult, type PlayerLog } from "./history";
import type { Stats } from "./types";

const STATS_KEY = "wtc-stats";
const DAILY_KEY = "wtc-daily";
const HISTORY_KEY = "wtc-history";
const SKIP_FIRST_KEY = "wtc-skip-first";

export const EMPTY_STATS: Stats = { score: 0, solved: 0, streak: 0, lastPlayed: "" };

export function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw) as Partial<Stats>;
    return {
      score: numberOrZero(parsed.score),
      solved: numberOrZero(parsed.solved),
      streak: numberOrZero(parsed.streak),
      lastPlayed: typeof parsed.lastPlayed === "string" ? parsed.lastPlayed : "",
    };
  } catch {
    return EMPTY_STATS;
  }
}

export function saveStats(stats: Stats): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function loadDaily(): DailyRecord | null {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed.date !== "string" || typeof parsed.reference !== "string") return null;
    if (parsed.phase !== "playing" && parsed.phase !== "correct" && parsed.phase !== "miss") return null;
    if (parsed.step !== 0 && parsed.step !== 1 && parsed.step !== 2 && parsed.step !== 3) return null;
    const hints = normalizeHints(parsed.hints, parsed.hintSpent);
    return {
      date: parsed.date,
      reference: parsed.reference,
      step: parsed.step,
      phase: parsed.phase,
      awarded: typeof parsed.awarded === "number" ? parsed.awarded : null,
      hints: hints.revealed,
      hintSpent: hints.spent,
      skippedFirst: parsed.skippedFirst === true,
    };
  } catch {
    return null;
  }
}

export function saveDaily(record: DailyRecord): void {
  localStorage.setItem(DAILY_KEY, JSON.stringify(record));
}

export function loadHistory(): PlayerLog {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return EMPTY_LOG;
    return normalizeLog(JSON.parse(raw));
  } catch {
    return EMPTY_LOG;
  }
}

export function recordGame(game: GameResult): void {
  const log = loadHistory();
  log.games.push(game);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(log));
}

export function loadSkipFirst(): boolean {
  try {
    return localStorage.getItem(SKIP_FIRST_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSkipFirst(skip: boolean): void {
  localStorage.setItem(SKIP_FIRST_KEY, skip ? "1" : "0");
}

export function recordShare(): void {
  const log = loadHistory();
  log.shares += 1;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(log));
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

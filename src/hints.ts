export const HINT_KINDS = ["type", "faction", "set"] as const;

export type HintKind = (typeof HINT_KINDS)[number];

/** Which facts are open, and whether this step already spent its one hint. */
export interface Hints {
  revealed: HintKind[];
  spent: boolean;
}

export function emptyHints(): Hints {
  return { revealed: [], spent: false };
}

export function hintCount(hints: Hints): number {
  return hints.revealed.length;
}

export function canReveal(hints: Hints, kind: HintKind): boolean {
  return !hints.spent && !hints.revealed.includes(kind);
}

export function revealHint(hints: Hints, kind: HintKind): Hints {
  if (!canReveal(hints, kind)) return hints;
  return { revealed: [...hints.revealed, kind], spent: true };
}

/** The next step keeps what is already open and allows one new hint. */
export function hintsForNextStep(hints: Hints): Hints {
  if (!hints.spent) return hints;
  return { revealed: hints.revealed, spent: false };
}

/**
 * Reads the saved hint list. Older games stored a count and opened type, then faction, then set.
 * A count above zero locks the current step, since that save has no record of when the hint was taken.
 */
export function normalizeHints(value: unknown, spent: unknown): Hints {
  if (Array.isArray(value)) {
    return {
      revealed: HINT_KINDS.filter((kind) => value.includes(kind)),
      spent: spent === true,
    };
  }
  const count = typeof value === "number" && Number.isFinite(value)
    ? Math.min(HINT_KINDS.length, Math.max(0, Math.floor(value)))
    : 0;
  return {
    revealed: HINT_KINDS.slice(0, count),
    spent: count > 0,
  };
}

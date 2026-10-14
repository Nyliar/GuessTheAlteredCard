import type { HintStep } from "./types";

/** Points for naming the card on that step, before hints. A miss on the last step scores nothing. */
export const STEP_POINTS = [10, 7, 4, 1] as const;

export function pointsFor(step: HintStep): number {
  return STEP_POINTS[step];
}

export function earnedPoints(step: HintStep, hints: number): number {
  return Math.max(0, pointsFor(step) - hints);
}

import { copy } from "./copy";
import { HINT_KINDS, type HintKind } from "./hints";
import { playedStep } from "./score";
import type { HintStep, Lang } from "./types";

const STAGES = [
  { icon: "🔳", width: 2 },
  // The shade blocks are already wider than an emoji, so they fill the column with no extra pad.
  { icon: "░▒▓", width: 5 },
  { icon: "🎨", width: 2 },
  { icon: "🖼️", width: 2 },
] as const;

/** Wide enough for the gradient, with the narrower icons centered inside it. */
const LEFT_WIDTH = 5;
const MARK_WIDTH = 2;
/** Fullwidth gap so the stage and the result read as two columns. */
const COLUMN_GAP = "\u3000";

const MONTHS = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
} as const;

export interface ShareResult {
  step: HintStep;
  solved: boolean;
  foil: boolean;
  /** Quiz day, as YYYY-MM-DD. */
  date: string;
  lang: Lang;
  /** The first crop was skipped, so that row is always a miss. */
  skippedFirst?: boolean;
  /** Hint categories opened during the puzzle. The values stay hidden. */
  hints?: readonly HintKind[];
}

/** Spoiler-free result: one row per stage. Later stages stay unmarked. */
export function shareText(result: ShareResult): string {
  const title = copy[result.lang].shareTitle;
  const foil = result.foil ? " ✨" : "";
  const step = playedStep(result.step, Boolean(result.skippedFirst));
  const rows = STAGES.map(({ icon, width }, index) => {
    const stage = center(icon, width, LEFT_WIDTH);
    if (index > step) return stage;
    const mark = result.solved && index === step ? "✅" : "❌";
    return `${stage}${COLUMN_GAP}${center(mark, MARK_WIDTH, MARK_WIDTH)}`;
  });
  return [`${title} - ${quizDate(result.date, result.lang)}${foil}`, ...rows, hintLine(result.hints, result.lang)].join("\n");
}

function hintLine(hints: readonly HintKind[] | undefined, lang: Lang): string {
  const text = copy[lang];
  const names: Record<HintKind, string> = {
    type: text.hintType,
    faction: text.hintFaction,
    set: text.hintSet,
  };
  const used = HINT_KINDS.filter((kind) => hints?.includes(kind)).map((kind) => names[kind]);
  return `💡 ${used.length > 0 ? used.join(", ") : text.shareNoHints}`;
}

function quizDate(day: string, lang: Lang): string {
  const [year, month, date] = day.split("-").map(Number);
  const label = MONTHS[lang][month - 1] ?? "";
  return lang === "fr" ? `${date} ${label} ${year}` : `${label} ${date}, ${year}`;
}

function center(text: string, textWidth: number, columnWidth: number): string {
  const extra = Math.max(0, columnWidth - textWidth);
  const left = Math.floor(extra / 2);
  return `${" ".repeat(left)}${text}${" ".repeat(extra - left)}`;
}

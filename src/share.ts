import { copy } from "./copy";
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
}

/** Spoiler-free result: one row per stage. Later stages stay unmarked. */
export function shareText(result: ShareResult): string {
  const title = copy[result.lang].shareTitle;
  const foil = result.foil ? " ✨" : "";
  const rows = STAGES.map(({ icon, width }, index) => {
    const stage = center(icon, width, LEFT_WIDTH);
    if (index > result.step) return stage;
    const mark = result.solved && index === result.step ? "✅" : "❌";
    return `${stage}${COLUMN_GAP}${center(mark, MARK_WIDTH, MARK_WIDTH)}`;
  });
  return [`${title} - ${quizDate(result.date, result.lang)}${foil}`, ...rows].join("\n");
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

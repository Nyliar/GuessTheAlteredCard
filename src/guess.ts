/** Loose match folds accents and punctuation. Exact match keeps both and only ignores case. */
export function isCorrectGuess(guess: string, answers: string[], exact: boolean): boolean {
  const cleaned = guess.trim();
  if (!cleaned) return false;
  const names = answers.map((answer) => answer.trim()).filter(Boolean);
  if (exact) {
    const folded = normalizeExact(cleaned);
    return names.some((name) => normalizeExact(name) === folded);
  }

  const loose = normalizeLoose(cleaned);
  if (!loose) return false;
  return names.some((name) => {
    if (normalizeLoose(name) === loose) return true;
    if (!name.includes("&")) return false;
    const parts = name
      .split("&")
      .map((part) => normalizeLoose(part))
      .filter((part) => part.length >= 3);
    return parts.includes(loose);
  });
}

export function normalizeLoose(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^the /, "");
}

function normalizeExact(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

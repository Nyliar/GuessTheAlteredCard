import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { applyResult, cardForDay, dayKey, formatRemaining, oneOfEachCharacter, previousDay } from "./daily";
import type { Character, Stats } from "./types";

const cards = ["a", "b", "c", "d"].map((reference) => ({ reference }) as Character);
const empty: Stats = { score: 0, solved: 0, streak: 0, lastPlayed: "" };

describe("oneOfEachCharacter", () => {
  it("keeps one art per character and prefers the common printing", () => {
    const picked = oneOfEachCharacter([
      { reference: "ALT_CORE_B_MU_18_R1" },
      { reference: "ALT_CORE_B_MU_18_C" },
      { reference: "ALT_CORE_B_MU_18_R2" },
      { reference: "ALT_CORE_B_BR_03_R1" },
    ]);
    assert.deepEqual(picked.map((card) => card.reference), ["ALT_CORE_B_MU_18_C", "ALT_CORE_B_BR_03_R1"]);
  });
});

describe("cardForDay", () => {
  it("picks the same card for the same day", () => {
    assert.equal(cardForDay(cards, "2026-10-13").reference, cardForDay(cards, "2026-10-13").reference);
  });

  it("can pick a different card on another day", () => {
    const seen = new Set(["2026-10-13", "2026-10-14", "2026-10-15", "2026-11-01"].map((day) => cardForDay(cards, day).reference));
    assert.ok(seen.size > 1);
  });
});

describe("applyResult", () => {
  it("starts a streak on a correct answer and ignores a second result the same day", () => {
    const first = applyResult(empty, 4, "2026-10-13", true, true);
    assert.deepEqual(first, { score: 4, solved: 1, streak: 1, lastPlayed: "2026-10-13" });
    assert.equal(applyResult(first, 4, "2026-10-13", true, true), first);
  });

  it("adds a streak step for every correct answer when the daily lock is off", () => {
    const first = applyResult(empty, 4, "2026-10-13", false, true);
    const second = applyResult(first, 3, "2026-10-13", false, true);
    assert.deepEqual(second, { score: 7, solved: 2, streak: 2, lastPlayed: "2026-10-13" });
  });

  it("clears the streak on a miss", () => {
    const first = applyResult(empty, 4, "2026-10-13", false, true);
    const missed = applyResult(first, 0, "2026-10-13", false, false);
    assert.equal(missed.streak, 0);
    assert.equal(missed.solved, 1);
    assert.equal(applyResult(missed, 2, "2026-10-16", false, true).streak, 1);
  });
});

describe("dates", () => {
  it("steps back one calendar day", () => {
    assert.equal(previousDay("2026-03-01"), "2026-02-28");
    assert.equal(dayKey(new Date(2026, 9, 13)), "2026-10-13");
  });

  it("formats the wait until midnight", () => {
    assert.equal(formatRemaining((9 * 3600 + 32 * 60 + 11) * 1000), "9H 32M 11S");
    assert.equal(formatRemaining(60 * 60000), "1H 00M 00S");
    assert.equal(formatRemaining(90 * 60000), "1H 30M 00S");
    assert.equal(formatRemaining(20 * 60000), "0H 20M 00S");
    assert.equal(formatRemaining(0), "0H 00M 00S");
  });
});

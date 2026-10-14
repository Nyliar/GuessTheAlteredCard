import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { normalizeLog, summarize, type PlayerLog } from "./history";

const log: PlayerLog = {
  shares: 2,
  games: [
    { reference: "ALT_CORE_A", points: 10, solved: true, foil: true },
    { reference: "ALT_CORE_B", points: 0, solved: false, foil: false },
    { reference: "ALT_CORE_A", points: 4, solved: true, foil: false },
    { reference: "ALT_CORE_C", points: 7, solved: true, foil: true },
  ],
};

describe("player history", () => {
  it("counts plays, solves, points, the average, foils, and shares", () => {
    const summary = summarize(log);
    assert.equal(summary.played, 4);
    assert.equal(summary.solved, 3);
    assert.equal(summary.points, 21);
    assert.equal(summary.average, 5.3);
    assert.equal(summary.foils, 2);
    assert.equal(summary.shares, 2);
  });

  it("lists each found card once, newest first, and keeps a foil", () => {
    const found = summarize(log).found;
    assert.deepEqual(found, [
      { reference: "ALT_CORE_C", foil: true },
      { reference: "ALT_CORE_A", foil: true },
    ]);
  });

  it("has no average before the first game", () => {
    const summary = summarize({ games: [], shares: 0 });
    assert.equal(summary.played, 0);
    assert.equal(summary.average, null);
    assert.deepEqual(summary.found, []);
  });

  it("drops a stored foil on a missed card", () => {
    const summary = summarize(normalizeLog({
      shares: 1.9,
      games: [{ reference: "ALT_CORE_B", points: 0, solved: false, foil: true }, { nope: true }],
    }));
    assert.equal(summary.foils, 0);
    assert.equal(summary.shares, 1);
    assert.equal(summary.played, 1);
  });
});

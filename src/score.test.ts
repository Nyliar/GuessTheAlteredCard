import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { earnedPoints, playedStep, pointsFor } from "./score";

describe("pointsFor", () => {
  it("pays 10, then 7, then 4, then 1", () => {
    assert.equal(pointsFor(0), 10);
    assert.equal(pointsFor(1), 7);
    assert.equal(pointsFor(2), 4);
    assert.equal(pointsFor(3), 1);
  });

  it("subtracts one point per hint and stops at zero", () => {
    assert.equal(earnedPoints(0, 1), 9);
    assert.equal(earnedPoints(1, 2), 5);
    assert.equal(earnedPoints(3, 3), 0);
  });
});

describe("playedStep", () => {
  it("scores a skipped first crop as the second step", () => {
    assert.equal(playedStep(0, true), 1);
    assert.equal(earnedPoints(playedStep(0, true), 0), 7);
    assert.equal(earnedPoints(playedStep(0, true), 2), 5);
  });

  it("leaves a later step, and a puzzle that shows the first crop, unchanged", () => {
    assert.equal(playedStep(2, true), 2);
    assert.equal(playedStep(0, false), 0);
  });
});

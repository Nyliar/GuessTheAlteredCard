import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { earnedPoints, pointsFor } from "./score";

describe("pointsFor", () => {
  it("pays 4, then 3, then 2, then 1", () => {
    assert.equal(pointsFor(0), 4);
    assert.equal(pointsFor(1), 3);
    assert.equal(pointsFor(2), 2);
    assert.equal(pointsFor(3), 1);
  });

  it("subtracts one point per hint and stops at zero", () => {
    assert.equal(earnedPoints(0, 1), 3);
    assert.equal(earnedPoints(1, 2), 1);
    assert.equal(earnedPoints(3, 3), 0);
  });
});

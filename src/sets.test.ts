import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { SETS, cardsInPool } from "./sets";

describe("cardsInPool", () => {
  it("keeps enabled sets and leaves Neverending Journey out", () => {
    const fugue = SETS.find((set) => set.code === "FUGUE");
    assert.equal(fugue?.enabled, false);
    assert.ok(SETS.filter((set) => set.code !== "FUGUE").every((set) => set.enabled));
    assert.deepEqual(
      cardsInPool([{ set: "CORE" }, { set: "FUGUE" }, { set: "ALIZE" }]).map((card) => card.set),
      ["CORE", "ALIZE"],
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { canReveal, emptyHints, hintsForNextStep, normalizeHints, revealHint } from "./hints";

describe("revealHint", () => {
  it("opens the chosen hint and locks the other two until the next step", () => {
    const after = revealHint(emptyHints(), "faction");
    assert.deepEqual(after.revealed, ["faction"]);
    assert.equal(after.spent, true);
    assert.equal(canReveal(after, "type"), false);
    assert.equal(canReveal(after, "set"), false);
    assert.equal(revealHint(after, "set"), after);
  });

  it("allows a different hint on the next step and keeps the one already open", () => {
    const spent = revealHint(emptyHints(), "set");
    const next = hintsForNextStep(spent);
    assert.equal(next.spent, false);
    assert.deepEqual(revealHint(next, "type").revealed, ["set", "type"]);
  });

  it("does not open the same hint twice", () => {
    const spent = revealHint(emptyHints(), "type");
    const next = hintsForNextStep(spent);
    assert.equal(canReveal(next, "type"), false);
    assert.equal(revealHint(next, "type"), next);
  });
});

describe("normalizeHints", () => {
  it("keeps a chosen list and whether this step is already spent", () => {
    assert.deepEqual(normalizeHints(["set", "type", "type"], false), {
      revealed: ["type", "set"],
      spent: false,
    });
    assert.equal(normalizeHints(["faction"], true).spent, true);
  });

  it("turns an older count into the first hints, in order, and locks that step", () => {
    assert.deepEqual(normalizeHints(2, undefined), {
      revealed: ["type", "faction"],
      spent: true,
    });
    assert.deepEqual(normalizeHints(0, undefined), emptyHints());
  });
});

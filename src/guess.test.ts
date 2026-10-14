import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { isCorrectGuess } from "./guess";

describe("isCorrectGuess", () => {
  it("matches a name ignoring case and extra spaces", () => {
    assert.equal(isCorrectGuess("  kelon   elemental ", ["Kelon Elemental"], false), true);
  });

  it("folds accents and punctuation in loose mode", () => {
    assert.equal(isCorrectGuess("melusine", ["Mélusine"], false), true);
    assert.equal(isCorrectGuess("sierra and oddball", ["Sierra & Oddball"], false), true);
  });

  it("accepts either half of a hero pair", () => {
    assert.equal(isCorrectGuess("sierra", ["Sierra & Oddball"], false), true);
    assert.equal(isCorrectGuess("oddball", ["Sierra & Oddball"], false), true);
  });

  it("drops a leading the", () => {
    assert.equal(isCorrectGuess("hare", ["The Hare"], false), true);
  });

  it("rejects a wrong name and an empty guess", () => {
    assert.equal(isCorrectGuess("brassbug", ["Kelon Elemental"], false), false);
    assert.equal(isCorrectGuess("   ", ["Kelon Elemental"], false), false);
    assert.equal(isCorrectGuess("and", ["Sierra & Oddball"], false), false);
  });

  it("requires accents and both hero names when exact spelling is on", () => {
    assert.equal(isCorrectGuess("melusine", ["Mélusine"], true), false);
    assert.equal(isCorrectGuess("Mélusine", ["Mélusine"], true), true);
    assert.equal(isCorrectGuess("sierra", ["Sierra & Oddball"], true), false);
    assert.equal(isCorrectGuess("Sierra & Oddball", ["Sierra & Oddball"], true), true);
  });

  it("accepts either language", () => {
    assert.equal(
      isCorrectGuess("elementaire de kelon", ["Kelon Elemental", "Élémentaire de Kelon"], false),
      true,
    );
  });
});

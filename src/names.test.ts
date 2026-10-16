import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { suggestNames } from "./names";
import type { Character } from "./types";

const cards: Character[] = [
  char("CORE_A", "Kelon Elemental", "Élémentaire de Kelon"),
  char("CORE_B", "The Hare", "Le Lièvre"),
  char("CORE_C", "Sierra & Oddball", "Sierra & Oddball"),
  char("CORE_D", "Brassbug", "Brassbug"),
  char("ALIZE_A", "Kelon Elemental", "Élémentaire de Kelon"),
];

describe("suggestNames", () => {
  it("returns nothing until the player has typed a name", () => {
    assert.deepEqual(suggestNames(cards, "en", "  "), []);
  });

  it("prefers a name that starts with the query and keeps one printing", () => {
    const matches = suggestNames(cards, "en", "kel");
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.name, "Kelon Elemental");
    assert.equal(matches[0]?.reference, "CORE_A");
  });

  it("matches a later word and folds accents", () => {
    assert.equal(suggestNames(cards, "en", "elemental")[0]?.name, "Kelon Elemental");
    assert.equal(suggestNames(cards, "fr", "elementaire")[0]?.name, "Élémentaire de Kelon");
  });

  it("shows at most five cards, closest first", () => {
    const pool = [
      char("1", "Akesha", "Akesha"),
      char("2", "Afanas", "Afanas"),
      char("3", "Aurore", "Aurore"),
      char("4", "Asterion", "Asterion"),
      char("5", "Anubis", "Anubis"),
      char("6", "Atlas", "Atlas"),
      char("7", "Brassbug", "Brassbug"),
    ];
    const matches = suggestNames(pool, "en", "a");
    assert.equal(matches.length, 5);
    assert.ok(matches.every((card) => card.name.startsWith("A")));
    assert.ok(!matches.some((card) => card.name === "Brassbug"));
    assert.ok(!matches.some((card) => card.name === "Aurore"));
  });
});

function char(reference: string, en: string, fr: string): Character {
  return {
    reference,
    name: { en, fr },
    faction: "OR",
    factionName: "Ordis",
    set: "CORE",
    setName: "Beyond the Gates",
    type: "Character",
  };
}

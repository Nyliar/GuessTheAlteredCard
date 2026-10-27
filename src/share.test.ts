import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { shareText } from "./share";

const gap = "\u3000";

describe("shareText", () => {
  it("checks the solved stage and adds the foil mark", () => {
    assert.equal(
      shareText({ step: 1, solved: true, foil: true, date: "2026-10-14", lang: "en" }),
      [
        "Guess the Altered Card - Oct 14, 2026 ✨",
        ` 🔳  ${gap}❌`,
        `░▒▓${gap}✅`,
        " 🎨  ",
        " 🖼️  ",
        "💡 none",
      ].join("\n"),
    );
  });

  it("leaves the foil mark off when the card was found later", () => {
    assert.equal(
      shareText({ step: 3, solved: true, foil: false, date: "2026-10-14", lang: "fr" }),
      [
        "Guess the Altered Card - 14 oct. 2026",
        ` 🔳  ${gap}❌`,
        `░▒▓${gap}❌`,
        ` 🎨  ${gap}❌`,
        ` 🖼️  ${gap}✅`,
        "💡 aucun",
      ].join("\n"),
    );
  });

  it("marks a skipped first crop as missed even when the recorded step is still the first", () => {
    assert.equal(
      shareText({ step: 0, solved: true, foil: true, date: "2026-10-14", lang: "en", skippedFirst: true }),
      [
        "Guess the Altered Card - Oct 14, 2026 ✨",
        ` 🔳  ${gap}❌`,
        `░▒▓${gap}✅`,
        " 🎨  ",
        " 🖼️  ",
        "💡 none",
      ].join("\n"),
    );
  });

  it("lists the opened hints in a fixed order and hides their values", () => {
    const hints = ["set", "type"] as const;
    assert.equal(
      shareText({ step: 2, solved: true, foil: false, date: "2026-10-14", lang: "en", hints }).split("\n").at(-1),
      "💡 type, set",
    );
    assert.equal(
      shareText({ step: 2, solved: true, foil: false, date: "2026-10-14", lang: "fr", hints }).split("\n").at(-1),
      "💡 type, extension",
    );
  });

  it("marks the stages that were reached and leaves the rest blank", () => {
    assert.equal(
      shareText({ step: 2, solved: false, foil: false, date: "2026-10-14", lang: "en" }).split("\n").slice(1).join("\n"),
      [
        ` 🔳  ${gap}❌`,
        `░▒▓${gap}❌`,
        ` 🎨  ${gap}❌`,
        " 🖼️  ",
        "💡 none",
      ].join("\n"),
    );
  });
});

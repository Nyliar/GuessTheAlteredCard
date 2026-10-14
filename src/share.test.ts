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
      ].join("\n"),
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
      ].join("\n"),
    );
  });
});

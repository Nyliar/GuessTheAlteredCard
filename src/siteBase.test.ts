import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { siteBase } from "./siteBase";

describe("siteBase", () => {
  it("keeps local dev at the domain root", () => {
    assert.equal(siteBase(undefined), "/");
    assert.equal(siteBase(""), "/");
    assert.equal(siteBase("/"), "/");
  });

  it("adds a trailing slash for a project site", () => {
    assert.equal(siteBase("/GuessTheAlteredCard"), "/GuessTheAlteredCard/");
    assert.equal(siteBase("GuessTheAlteredCard/"), "/GuessTheAlteredCard/");
  });
});

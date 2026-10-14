import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { findArtCrop } from "./crop";

describe("findArtCrop", () => {
  it("keeps the illustration between the name banner and the rules panel", () => {
    const width = 100;
    const height = 200;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      const cream = (y >= 16 && y < 25) || y >= 150;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        data[i] = cream ? 230 : 40 + (x % 50);
        data[i + 1] = cream ? 220 : 70;
        data[i + 2] = cream ? 200 : 90;
        data[i + 3] = 255;
      }
    }

    const crop = findArtCrop(data, width, height);
    assert.ok(crop.top >= 25 && crop.top < 45);
    assert.ok(crop.top + crop.height < 150);
    assert.ok(crop.top + crop.height > 120);
    assert.ok(crop.left > 0);
  });
});

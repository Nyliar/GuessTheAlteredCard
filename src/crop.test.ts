import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { cropArtCell, findArtCrop, pickClosestArtCell } from "./crop";

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

describe("cropArtCell", () => {
  const crop = { left: 10, top: 20, width: 99, height: 90 };

  it("takes the top-left cell", () => {
    assert.deepEqual(cropArtCell(crop, 0), { left: 10, top: 20, width: 33, height: 30 });
  });

  it("takes the center cell", () => {
    assert.deepEqual(cropArtCell(crop, 4), { left: 43, top: 50, width: 33, height: 30 });
  });

  it("takes the bottom-right cell", () => {
    assert.deepEqual(cropArtCell(crop, 8), { left: 76, top: 80, width: 33, height: 30 });
  });

  it("covers the illustration without gaps", () => {
    const cells = Array.from({ length: 9 }, (_, index) => cropArtCell(crop, index));
    assert.equal(cells[0]?.left, crop.left);
    assert.equal(cells[2]?.left + cells[2].width, crop.left + crop.width);
    assert.equal(cells[6]?.top, crop.top + crop.height - cells[6].height);
    assert.equal(cells[8]?.left + cells[8].width, crop.left + crop.width);
    assert.equal(cells[8]?.top + cells[8].height, crop.top + crop.height);
  });
});

describe("pickClosestArtCell", () => {
  const crop = { left: 10, top: 20, width: 99, height: 90 };

  it("opens a top-left 4×3 cell into the matching 3×3, 2×3, then 2×2 cell", () => {
    const twelve = cropArtCell(crop, 0, 4, 3);
    const nine = pickClosestArtCell(crop, 3, 3, twelve);
    const six = pickClosestArtCell(crop, 2, 3, nine);
    const four = pickClosestArtCell(crop, 2, 2, six);
    assert.deepEqual(nine, cropArtCell(crop, 0, 3, 3));
    assert.deepEqual(six, cropArtCell(crop, 0, 2, 3));
    assert.deepEqual(four, cropArtCell(crop, 0, 2, 2));
  });

  it("opens a bottom-right 4×3 cell into the matching 3×3, 2×3, then 2×2 cell", () => {
    const twelve = cropArtCell(crop, 11, 4, 3);
    const nine = pickClosestArtCell(crop, 3, 3, twelve);
    const six = pickClosestArtCell(crop, 2, 3, nine);
    const four = pickClosestArtCell(crop, 2, 2, six);
    assert.deepEqual(nine, cropArtCell(crop, 8, 3, 3));
    assert.deepEqual(six, cropArtCell(crop, 5, 2, 3));
    assert.deepEqual(four, cropArtCell(crop, 3, 2, 2));
  });
});

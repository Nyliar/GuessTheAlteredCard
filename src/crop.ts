export interface ArtCrop {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const ART_GRID = 3;

/** Columns and rows for each puzzle step: 12, 9, 6, then 4 cells. */
export const STEP_GRIDS = [
  [4, 3],
  [3, 3],
  [2, 3],
  [2, 2],
] as const;

/** One cell of a grid split of the illustration. `index` is row-major. */
export function cropArtCell(crop: ArtCrop, index: number, columns = ART_GRID, rows = ART_GRID): ArtCrop {
  const col = ((index % columns) + columns) % columns;
  const row = Math.floor(index / columns) % rows;
  const left = crop.left + Math.round((crop.width * col) / columns);
  const right = crop.left + Math.round((crop.width * (col + 1)) / columns);
  const top = crop.top + Math.round((crop.height * row) / rows);
  const bottom = crop.top + Math.round((crop.height * (row + 1)) / rows);
  return { left, top, width: right - left, height: bottom - top };
}

/** The cell whose center is closest to the previous crop's center. */
export function pickClosestArtCell(bounds: ArtCrop, columns: number, rows: number, previous: ArtCrop): ArtCrop {
  const cx = previous.left + previous.width / 2;
  const cy = previous.top + previous.height / 2;
  let best = cropArtCell(bounds, 0, columns, rows);
  let bestDist = Infinity;
  for (let index = 0; index < columns * rows; index += 1) {
    const cell = cropArtCell(bounds, index, columns, rows);
    const dx = cell.left + cell.width / 2 - cx;
    const dy = cell.top + cell.height / 2 - cy;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = cell;
    }
  }
  return best;
}

/**
 * Card art is full-bleed, with the name on a light banner and the rules on a light panel.
 * This finds those bands and returns the illustration between them, inset past the stat pips.
 */
export function findArtCrop(data: Uint8ClampedArray, width: number, height: number): ArtCrop {
  const fallback = (): ArtCrop => ({
    left: Math.floor(width * 0.2),
    top: Math.floor(height * 0.16),
    width: Math.floor(width * 0.75),
    height: Math.floor(height * 0.46),
  });

  const creamAt = (y: number) => {
    let cream = 0;
    let n = 0;
    const x0 = Math.floor(width * 0.28);
    const x1 = Math.floor(width * 0.72);
    for (let x = x0; x < x1; x += 3) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (r + g + b) / 3;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      n++;
      if (lum > 185 && chroma < 42) cream++;
    }
    return n === 0 ? 0 : cream / n;
  };

  let panelTop = Math.floor(height * 0.68);
  for (let y = Math.floor(height * 0.52); y < height * 0.82; y++) {
    if (creamAt(y) > 0.62) {
      panelTop = y;
      break;
    }
  }

  let nameBottom = Math.floor(height * 0.145);
  let gap = 0;
  for (let y = Math.floor(height * 0.08); y < height * 0.26; y++) {
    if (creamAt(y) > 0.18) {
      nameBottom = y;
      gap = 0;
    } else if (nameBottom > height * 0.1) {
      gap++;
      if (gap > 28) break;
    }
  }

  const left = Math.floor(width * 0.2);
  const right = Math.floor(width * 0.93);
  const top = Math.min(nameBottom + 6, panelTop - 80);
  const bottom = Math.max(top + 80, panelTop - Math.floor(height * 0.06));
  if (right - left < 40 || bottom - top < 40) return fallback();
  return { left, top, width: right - left, height: bottom - top };
}

import { STEP_GRIDS, cropArtCell, findArtCrop, pickClosestArtCell, type ArtCrop } from "./crop";
import type { HintStep, Lang } from "./types";

export function cardImageUrl(reference: string, lang: Lang = "en"): string {
  const set = reference.split("_")[1];
  return `https://cdn.alteredcore.org/cards/${lang}/${set}/${reference}.webp`;
}

export function loadCardImage(reference: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${reference}`));
    image.src = cardImageUrl(reference);
  });
}

export function drawPuzzle(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  step: HintStep,
  reference: string,
): void {
  const sample = document.createElement("canvas");
  sample.width = image.naturalWidth;
  sample.height = image.naturalHeight;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) return;
  sampleCtx.drawImage(image, 0, 0);
  const pixels = sampleCtx.getImageData(0, 0, sample.width, sample.height);
  const crop = findArtCrop(pixels.data, sample.width, sample.height);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  drawCell(canvas, image, sourceForStep(crop, step, reference), dpr, step);
}

function drawCell(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  cell: ArtCrop,
  dpr: number,
  step: HintStep,
): void {
  const { width, height } = displaySize(canvas, cell.width, cell.height);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, width, height);
  if (step === 0) ctx.filter = "grayscale(1) contrast(3.1) blur(2.5px)";
  if (step === 1) ctx.filter = "grayscale(1) contrast(1.15)";
  ctx.drawImage(image, cell.left, cell.top, cell.width, cell.height, 0, 0, width, height);
  ctx.filter = "none";
}

/** Fit the crop into the stage: as large as possible without overflowing. */
function displaySize(canvas: HTMLCanvasElement, srcWidth: number, srcHeight: number): { width: number; height: number } {
  const stage = canvas.parentElement;
  const styles = stage ? getComputedStyle(stage) : null;
  const padX = styles ? (Number.parseFloat(styles.paddingLeft) || 0) + (Number.parseFloat(styles.paddingRight) || 0) : 36;
  const maxWidth = Math.max(1, (stage?.clientWidth ?? Math.min(window.innerWidth, 650)) - padX);
  const maxHeight = Math.min(window.innerHeight * 0.58, 520);
  if (srcWidth <= 0 || srcHeight <= 0) return { width: maxWidth, height: maxHeight };
  const scale = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * scale)),
    height: Math.max(1, Math.round(srcHeight * scale)),
  };
}

function sourceForStep(crop: ArtCrop, step: HintStep, reference: string): ArtCrop {
  const [columns, rows] = STEP_GRIDS[0];
  let cell = cropArtCell(crop, pickArtCell(reference), columns, rows);
  for (let index = 1; index <= step; index += 1) {
    const grid = STEP_GRIDS[index];
    if (!grid) break;
    cell = pickClosestArtCell(crop, grid[0], grid[1], cell);
  }
  return cell;
}

function pickArtCell(reference: string): number {
  const [columns, rows] = STEP_GRIDS[0];
  const rand = mulberry32(hash(`${reference}:region`));
  return Math.floor(rand() * (columns * rows));
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

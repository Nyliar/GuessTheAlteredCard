import { findArtCrop, type ArtCrop } from "./crop";
import type { HintStep } from "./types";

export function cardImageUrl(reference: string): string {
  const set = reference.split("_")[1];
  return `https://cdn.alteredcore.org/cards/en/${set}/${reference}.webp`;
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
  if (step < 3) {
    drawDetail(canvas, image, crop, reference, dpr, step);
    return;
  }

  canvas.width = Math.round(crop.width * dpr);
  canvas.height = Math.round(crop.height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, crop.width, crop.height);
  ctx.drawImage(image, crop.left, crop.top, crop.width, crop.height, 0, 0, crop.width, crop.height);
}

function drawDetail(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  crop: ArtCrop,
  reference: string,
  dpr: number,
  step: HintStep,
): void {
  const minSide = Math.min(crop.width, crop.height);
  // The silhouette and the grayscale share a focus. Color opens the window around it.
  const sourceFraction = step < 2 ? 0.34 : 0.5;
  const displayFraction = step < 2 ? 0.72 : 0.86;
  const size = Math.round(minSide * displayFraction);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext("2d", { willReadFrequently: step === 0 });
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const rand = mulberry32(hash(reference));
  const focusSize = Math.round(minSide * 0.34);
  const focusX = Math.max(0, crop.width - focusSize);
  const focusY = Math.max(0, crop.height - focusSize);
  const smallX = crop.left + Math.floor(rand() * (focusX + 1));
  const smallY = crop.top + Math.floor(rand() * (focusY + 1));
  const windowSize = Math.round(minSide * sourceFraction);
  const sx = clamp(smallX - Math.round((windowSize - focusSize) / 2), crop.left, crop.left + crop.width - windowSize);
  const sy = clamp(smallY - Math.round((windowSize - focusSize) / 2), crop.top, crop.top + crop.height - windowSize);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 3;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  if (step === 1) ctx.filter = "grayscale(1) contrast(1.15)";
  ctx.drawImage(image, sx, sy, windowSize, windowSize, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.filter = "none";
  ctx.restore();

  if (step === 0) {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    paintSilhouette(pixels);
    ctx.putImageData(pixels, 0, 0);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(226, 177, 90, 0.75)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

/** Turns the detail into a solid black shape, the way a Who's That Pokémon shadow reads. */
function paintSilhouette(image: ImageData): void {
  const { data, width, height } = image;
  const hist = new Uint32Array(256);
  const lums = new Uint8Array(width * height);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    if (data[i + 3] < 16) {
      lums[pixel] = 0;
      continue;
    }
    const lum = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    lums[pixel] = lum;
    hist[lum] += 1;
    count += 1;
  }
  if (count === 0) return;
  const threshold = otsu(hist, count);

  let darkRim = 0;
  let rimCount = 0;
  const maxR = Math.min(width, height) / 2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dist = Math.hypot(x - width / 2, y - height / 2);
      if (dist < maxR * 0.82 || dist > maxR * 0.96) continue;
      const pixel = y * width + x;
      if (data[pixel * 4 + 3] < 16) continue;
      rimCount += 1;
      if (lums[pixel] < threshold) darkRim += 1;
    }
  }
  const subjectIsDark = rimCount === 0 || darkRim / rimCount < 0.55;

  for (let pixel = 0; pixel < lums.length; pixel += 1) {
    const offset = pixel * 4;
    if (data[offset + 3] < 16) continue;
    const lum = lums[pixel];
    const depth = subjectIsDark ? threshold - lum : lum - threshold;
    if (depth <= 0) {
      data[offset + 3] = 0;
      continue;
    }
    data[offset] = 8;
    data[offset + 1] = 8;
    data[offset + 2] = 10;
    data[offset + 3] = depth >= 14 ? 255 : Math.round((depth / 14) * 255);
  }
  fillEnclosed(data, width, height);
}

function fillEnclosed(data: Uint8ClampedArray, width: number, height: number): void {
  const seen = new Uint8Array(width * height);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (seen[pixel] || data[pixel * 4 + 3] > 40) return;
    seen[pixel] = 1;
    stack.push(pixel);
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length > 0) {
    const pixel = stack.pop() ?? 0;
    const x = pixel % width;
    const y = (pixel - x) / width;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    if (seen[pixel] || data[offset + 3] > 40) continue;
    data[offset] = 8;
    data[offset + 1] = 8;
    data[offset + 2] = 10;
    data[offset + 3] = 255;
  }
}

function otsu(hist: Uint32Array, total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * hist[i];
  let sumBackground = 0;
  let weightBackground = 0;
  let best = 0;
  let threshold = 128;
  for (let i = 0; i < 256; i += 1) {
    weightBackground += hist[i];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;
    sumBackground += i * hist[i];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const between = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
    if (between > best) {
      best = between;
      threshold = i;
    }
  }
  return threshold;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

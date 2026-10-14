// Builds a slim character catalog from the community set files.
// Source: https://github.com/PolluxTroy0/Altered-TCG-Card-Database
// Images are not downloaded; the app loads them from cdn.alteredcore.org.

import fs from "node:fs";
import path from "node:path";
import config from "../src/sets.json" with { type: "json" };

const ROOT = "https://raw.githubusercontent.com/PolluxTroy0/Altered-TCG-Card-Database/main/SETS";
const SETS = config.sets.map((set) => set.code);
const ENABLED = new Set(config.sets.filter((set) => set.enabled).map((set) => set.code));

async function loadSet(code, lang) {
  const url = `${ROOT}/${code}/${code}_${lang}.json`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const json = await res.json();
  const raw = Array.isArray(json) ? json : json["hydra:member"] || [];
  return raw;
}

function pickName(card) {
  const name = card?.name;
  if (typeof name === "string") return name.trim();
  if (name && typeof name === "object") return String(name.en ?? name.fr ?? "").trim();
  return "";
}

const characters = [];
const skipped = [];

for (const code of SETS) {
  const [enCards, frCards] = await Promise.all([loadSet(code, "EN"), loadSet(code, "FR")]);
  if (!enCards) {
    skipped.push(code);
    continue;
  }
  const french = new Map((frCards ?? []).map((card) => [card.reference, pickName(card)]));
  const byType = {};
  let kept = 0;
  for (const card of enCards) {
    const reference = card.reference ?? "";
    const parts = reference.split("_");
    const en = pickName(card);
    if (!reference || !en) continue;
    const typeName = card.cardType?.name ?? card.cardType?.reference ?? "";
    const typeKey = card.cardType?.reference ?? "UNKNOWN";
    byType[typeKey] = (byType[typeKey] ?? 0) + 1;
    const fr = french.get(reference) || en;
    characters.push({
      reference,
      name: { en, fr },
      faction: card.mainFaction?.reference ?? parts[3] ?? "??",
      factionName: card.mainFaction?.name ?? parts[3] ?? "Unknown",
      set: card.cardSet?.reference ?? code,
      setName: card.cardSet?.name ?? code,
      type: typeName,
    });
    kept++;
  }
  console.log(`${code}: ${kept}${ENABLED.has(code) ? "" : " (ignored by the pool)"}`, byType);
}

characters.sort((a, b) => a.set.localeCompare(b.set) || a.reference.localeCompare(b.reference));

const outDir = path.resolve("src/data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "characters.json");
fs.writeFileSync(outPath, JSON.stringify({ characters }));
console.log(`wrote ${characters.length} cards to ${outPath}`);
if (skipped.length) console.log("missing sets:", skipped.join(", "));

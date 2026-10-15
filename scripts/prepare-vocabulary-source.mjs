import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Converter } from "opencc-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "tmp/vocabulary-sources");
const read = (name) => fs.readFileSync(path.join(source, name), "utf8");
const hashes = {
  "ngsl-1.2.csv": "2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44",
  "cow-cmn.tab": "379fd2e41d3e1395f9f27cf23a39c6181849ffb4020c14a07ed2a4d4dd651122",
  "WordNet-3.0.tar.gz": "640db279c949a88f61f851dd54ebbb22d003f8b90b85267042ef85a3781d3a52",
  "COW-LICENSE": "81a3cb1f97e120581d67c71424f2de5dd96325d951f991e8a092147a2a4b2321",
};
for (const [name, expected] of Object.entries(hashes)) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(source, name))).digest("hex");
  if (actual !== expected) throw new Error(`來源雜湊不符：${name}，不可繼續產生詞庫。`);
}
const convert = Converter({ from: "cn", to: "twp" });
const baseline = JSON.parse(fs.readFileSync(path.join(root, "public/data/vocabulary-targets-v1.json"), "utf8"));
const existing = new Set(baseline.entries.flatMap((entry) => [entry.lexemeId, ...entry.sourceLexemeIds]));
const chinese = new Map();
for (const line of read("cow-cmn.tab").split(/\r?\n/)) {
  const [id, type, value] = line.split("\t");
  if (type !== "cmn:lemma" || !value || !/^[\p{Script=Han}、，（）·+]+$/u.test(value)) continue;
  const text = convert(value.replaceAll("+", "")).trim();
  if (text.length > 18) continue;
  if (!chinese.has(id)) chinese.set(id, []);
  if (!chinese.get(id).includes(text)) chinese.get(id).push(text);
}
const synsets = new Map();
for (const pos of ["noun", "verb", "adj", "adv"]) {
  for (const line of read(`WordNet-3.0/dict/data.${pos}`).split(/\r?\n/)) {
    if (!/^\d{8} /.test(line)) continue;
    const [data, gloss] = line.split(" | ");
    const fields = data.split(" ");
    const type = fields[2] === "s" ? "a" : fields[2];
    const id = `${fields[0]}-${type}`;
    const count = Number.parseInt(fields[3], 16);
    const lemmas = Array.from({ length: count }, (_, i) => fields[4 + i * 2]);
    synsets.set(id, { definitionEn: (gloss ?? "").trim(), partOfSpeech: pos, lemmas, lexname: Number(fields[1]) });
  }
}
const words = new Map();
for (const line of read("WordNet-3.0/dict/index.sense").split(/\r?\n/)) {
  const [senseKey, offset, order, count] = line.split(" ");
  if (!senseKey || !offset) continue;
  const [word, sense] = senseKey.split("%");
  if (!/^[a-z]+$/.test(word) || word.length < 2) continue;
  const pos = { "1": "n", "2": "v", "3": "a", "4": "r", "5": "a" }[sense?.[0]];
  const synsetId = `${offset}-${pos}`;
  const synset = synsets.get(synsetId);
  if (!synset || !chinese.has(synsetId)) continue;
  const candidate = { lemma: word, synsetId, senseKey, senseOrder: Number(order), tagCount: Number(count), ...synset,
    translationZhTw: chinese.get(synsetId).slice(0, 3).join("／") };
  if (!words.has(word)) words.set(word, []);
  words.get(word).push(candidate);
}
const ranks = new Map(read("ngsl-1.2.csv").split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
  const [word, rank] = line.split(",");
  return [word.toLowerCase(), Number(rank)];
}));
const candidates = [...words].map(([word, senses]) => {
  senses.sort((a, b) => b.tagCount - a.tagCount || a.senseOrder - b.senseOrder || a.synsetId.localeCompare(b.synsetId));
  return { ...senses[0], ngslRank: ranks.get(word) ?? null, totalTagCount: senses.reduce((sum, item) => sum + item.tagCount, 0) };
}).filter((entry) => !existing.has(entry.lemma));
const overridePath = path.join(root, "data-sources/vocabulary-3000/editorial-overrides.json");
const overrides = fs.existsSync(overridePath) ? JSON.parse(fs.readFileSync(overridePath, "utf8")) : {};
const aliases = {
  people: "person",
  could: "can", might: "may", criteria: "criterion", better: "good", best: "good",
  further: "far", furthest: "far", least: "little", worse: "bad", worst: "bad",
  colour: "color", centre: "center", labour: "labor", favour: "favor", neighbour: "neighbor",
  honour: "honor", behaviour: "behavior", organise: "organize", recognise: "recognize",
  realise: "realize", apologise: "apologize", analyse: "analyze", programme: "program",
  defence: "defense", offence: "offense", licence: "license", travelling: "travel",
  learnt: "learn", towards: "toward", amongst: "among", whilst: "while", mum: "mom",
};
const supplement = JSON.parse(fs.readFileSync(path.join(root, "data-sources/vocabulary-3000/supplement-lemmas.json"), "utf8")).lemmas;
const allowedSupplement = new Set(supplement);
const canonicalCandidates = new Map();
for (const candidate of candidates) {
  const lemma = aliases[candidate.lemma] ?? candidate.lemma;
  if (lemma !== candidate.lemma || existing.has(lemma)) continue;
  if (!candidate.ngslRank && !allowedSupplement.has(lemma)) continue;
  const override = overrides[lemma];
  canonicalCandidates.set(lemma, { ...candidate, ...(override ?? {}), originalMeaning: Boolean(override),
    // Source examples are not learner-authored sentences; retain only the gloss.
    definitionEn: (override?.definitionEn ?? candidate.definitionEn.split(/;\s*"/)[0]).trim(),
  });
}
for (const [sourceLemma, rank] of ranks) {
  const lemma = aliases[sourceLemma] ?? sourceLemma;
  if (existing.has(lemma)) continue;
  const override = overrides[lemma] ?? overrides[sourceLemma];
  const found = canonicalCandidates.get(lemma);
  if (found) {
    found.ngslRank = Math.min(found.ngslRank ?? Infinity, rank);
  } else if (override) {
    canonicalCandidates.set(lemma, { lemma, ...override, originalMeaning: true, synsetId: "", senseKey: "", senseOrder: 0, tagCount: 0, totalTagCount: 0, lemmas: [lemma], lexname: -1, ngslRank: rank });
  }
}
candidates.sort((a, b) => (a.ngslRank ?? Infinity) - (b.ngslRank ?? Infinity) || b.totalTagCount - a.totalTagCount || a.lemma.localeCompare(b.lemma));
const pool = [...canonicalCandidates.values()].sort((a, b) => (a.ngslRank ?? Infinity) - (b.ngslRank ?? Infinity) || supplement.indexOf(a.lemma) - supplement.indexOf(b.lemma) || a.lemma.localeCompare(b.lemma));
const selected = pool.slice(0, 2868);
const missingNgsl = [...ranks.keys()].filter((word) => !existing.has(word) && !words.has(word));
const output = path.join(source, "candidate-analysis.json");
fs.writeFileSync(output, JSON.stringify({ ngslCount: ranks.size, candidates: candidates.length, ngslSelected: selected.filter((item) => item.ngslRank).length, missingNgsl, selected }, null, 2));
console.log(JSON.stringify({ ngslCount: ranks.size, candidates: candidates.length, ngslSelected: selected.filter((item) => item.ngslRank).length, missingNgsl, preview: selected.slice(0, 25).map(({ lemma, translationZhTw, definitionEn }) => ({ lemma, translationZhTw, definitionEn })) }, null, 2));
console.log("Source digests", JSON.stringify(Object.fromEntries(["ngsl-1.2.csv", "cow-cmn.tab", "WordNet-3.0.tar.gz", "COW-LICENSE"].map((name) => [name, crypto.createHash("sha256").update(fs.readFileSync(path.join(source, name))).digest("hex")]))));
if (process.argv.includes("--snapshot")) {
  if (selected.length !== 2868) throw new Error(`詞彙來源不足：${selected.length}/2868。`);
  const directory = path.join(root, "data-sources/vocabulary-3000");
  const snapshot = { schemaVersion: 1, sourceVersion: "2026-10-15", selected: selected.map(({ lemmas, ...entry }) => { void lemmas; return entry; }) };
  fs.writeFileSync(path.join(directory, "lexicon-snapshot.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${selected.length} source records.`);
}

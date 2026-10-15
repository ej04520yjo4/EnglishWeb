import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { parseVocabularyTargets } from "../app/vocabulary-targets.ts";
import { parseVocabularyLibrary } from "../app/vocabulary-library.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const json = (name) => JSON.parse(read(name));
const digest = (name) => crypto.createHash("sha256").update(read(name).replace(/\r\n/g, "\n")).digest("hex");
const sourceDirectory = "data-sources/vocabulary-3000";
const baseline = json("public/data/vocabulary-targets-v1.json");
const meanings = json(`${sourceDirectory}/baseline-meanings.json`);
const snapshot = json(`${sourceDirectory}/lexicon-snapshot.json`);
const sources = json(`${sourceDirectory}/sources.json`).sources;
const snapshotHash = digest(`${sourceDirectory}/lexicon-snapshot.json`);
const editorialHash = digest(`${sourceDirectory}/editorial-overrides.json`);
const getSource = (file, sourceType, reference) => {
  const source = sources.find((entry) => entry.file === file);
  if (!source) throw new Error(`詞庫缺少來源清單：${file}。`);
  return {
    sourceName: file === "ngsl-1.2.csv" ? "New General Service List" : file === "cow-cmn.tab" ? "Chinese Open WordNet" : "WordNet",
    sourceVersion: source.version,
    sourceType,
    license: source.license,
    reference,
    artifactSha256: source.sha256,
    attribution: source.attribution,
  };
};
const originalSource = (lexemeId) => ({
  sourceName: "EnglishWeb editorial meaning",
  sourceVersion: "2026-10-15",
  sourceType: "original_content",
  license: "CC-BY-SA-4.0",
  reference: `${sourceDirectory}/editorial-overrides.json#${lexemeId}`,
  artifactSha256: editorialHash,
  attribution: "EnglishWeb machine-assisted editorial additions; human review pending",
});
const posLabels = {
  noun: "noun 名詞", verb: "verb 動詞", adj: "adjective 形容詞", adjective: "adjective 形容詞",
  adv: "adverb 副詞", adverb: "adverb 副詞", pronoun: "pronoun 代名詞", determiner: "determiner 限定詞",
  preposition: "preposition 介系詞", conjunction: "conjunction 連接詞", auxiliary: "auxiliary 助動詞",
  interjection: "interjection 感嘆詞", article: "article 冠詞",
};
if (baseline.entries.length !== 132 || snapshot.selected.length !== 2868) {
  throw new Error("詞庫必須保留132個既有目標，另增2868個不同的canonical單字。");
}
const quotas = [
  { targetLevel: "A1", masteryTarget: "active", count: 634 },
  { targetLevel: "A1", masteryTarget: "receptive", count: 476 },
  { targetLevel: "A2", masteryTarget: "active", count: 758 },
  { targetLevel: "A2", masteryTarget: "receptive", count: 1000 },
];
const allocations = quotas.flatMap(({ count, ...allocation }) => Array.from({ length: count }, () => allocation));
const additions = snapshot.selected.map((entry, index) => {
  const sourceRefs = [];
  if (entry.ngslRank) sourceRefs.push(getSource("ngsl-1.2.csv", "frequency", `https://www.newgeneralservicelist.com/new-general-service-list#${entry.lemma}`));
  if (entry.originalMeaning) {
    sourceRefs.push(originalSource(entry.lemma));
  } else {
    if (!entry.synsetId || !entry.senseKey) throw new Error(`${entry.lemma} 缺少對應詞義來源。`);
    sourceRefs.push(getSource("WordNet-3.0.tar.gz", "open_lexicon", `https://wordnet.princeton.edu/#${entry.senseKey}`));
    sourceRefs.push(getSource("cow-cmn.tab", "open_lexicon", `https://github.com/omwn/omw-data/blob/406bf83b3c507a3d1f26e88252d5d66893fd36bf/wns/cow/wn-data-cmn.tab#${entry.synsetId}`));
  }
  return {
    lexemeId: entry.lemma,
    lemma: entry.lemma,
    sourceLexemeIds: [entry.lemma],
    ...allocations[index],
    curriculumPriority: index + 133,
    topics: ["general-vocabulary"],
    sourceRefs,
    qaStatus: "pilot_review_required",
  };
});
const targets = parseVocabularyTargets({
  schemaVersion: 2,
  status: "count_complete_review_required",
  completionLevel: "A2",
  goals: baseline.goals,
  entries: [...baseline.entries, ...additions],
});
const snapshotById = new Map(snapshot.selected.map((entry) => [entry.lemma, entry]));
const entries = targets.entries.map((target) => {
  const entry = snapshotById.get(target.lexemeId) ?? meanings[target.lexemeId];
  if (!entry) throw new Error(`${target.lexemeId} 缺少詞庫意思。`);
  const sourceSense = snapshotById.get(target.lexemeId);
  const partOfSpeech = posLabels[entry.partOfSpeech] ?? entry.partOfSpeech;
  return {
    lexemeId: target.lexemeId,
    displayEnglish: target.lemma,
    translationZhTw: entry.translationZhTw,
    partOfSpeech,
    definitionEn: entry.definitionEn,
    usageNoteZhTw: `${entry.usageNoteZhTw || "此處練習一個常見詞義；同一單字在其他語境可能有不同意思。"} 詞義、用法與分級仍待人工複核。`,
    sourceRefs: target.sourceRefs,
    qaStatus: "pilot_review_required",
    phoneticStatus: "pending",
    audioStatus: "fallback",
    batchId: `vocab-batch-${String(Math.ceil(target.curriculumPriority / 50)).padStart(3, "0")}`,
    ...(sourceSense && !sourceSense.originalMeaning ? { sourceSenseId: sourceSense.senseKey, wordnetSynsetId: sourceSense.synsetId } : {}),
  };
});
const library = parseVocabularyLibrary({ schemaVersion: 1, sourceVersion: "vocabulary-library-v1", entries }, targets);
const manifest = {
  schemaVersion: 1,
  sourceVersion: "vocabulary-library-v1",
  generatedFrom: "2026-10-15 pinned source snapshot",
  targetCount: targets.entries.length,
  legacyCount: baseline.entries.length,
  addedCount: additions.length,
  batchCount: 60,
  frequencyRankedAdditions: snapshot.selected.filter((entry) => entry.ngslRank).length,
  supplementalAdditions: snapshot.selected.filter((entry) => !entry.ngslRank).length,
  editorialMeanings: snapshot.selected.filter((entry) => entry.originalMeaning).length,
  sourceSnapshotSha256: snapshotHash,
  baselineMeaningsSha256: digest(`${sourceDirectory}/baseline-meanings.json`),
  editorialOverridesSha256: editorialHash,
  targetQaStatus: targets.status,
  note: "Stage allocations are planning candidates, not CEFR certification. Count complete does not mean learner mastery or human QA complete.",
};
for (const [name, value] of [
  ["public/data/vocabulary-targets-v2.json", targets],
  ["public/data/vocabulary-library-v1.json", library],
  [`${sourceDirectory}/build-manifest.json`, manifest],
]) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (process.argv.includes("--check")) {
    if (read(name).replace(/\r\n/g, "\n") !== content) throw new Error(`詞庫產生器輸出不同：${name}。請重新產生並檢查差異。`);
  } else {
    fs.writeFileSync(path.join(root, name), content);
  }
}
console.log(`Vocabulary catalog ${process.argv.includes("--check") ? "verified" : "generated"}: 3000 canonical lexemes, 60 batches, 1500 active / 1500 receptive candidates. Human review pending.`);

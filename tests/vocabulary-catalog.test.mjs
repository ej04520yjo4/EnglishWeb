import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { parseVocabularyTargets, buildVocabularyCoverageReport } from "../app/vocabulary-targets.ts";
import { parseVocabularyLibrary, buildVocabularyLibraryPage } from "../app/vocabulary-library.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const targets = parseVocabularyTargets(read("public/data/vocabulary-targets-v2.json"));
const library = parseVocabularyLibrary(read("public/data/vocabulary-library-v1.json"), targets);
const baseline = read("public/data/vocabulary-targets-v1.json");
const snapshot = read("data-sources/vocabulary-3000/lexicon-snapshot.json");

test("the shipped catalog really contains 3000 canonical words and preserves the 132 legacy objects", () => {
  assert.equal(targets.entries.length, 3000);
  assert.equal(new Set(targets.entries.map((entry) => entry.lexemeId)).size, 3000);
  assert.deepEqual(targets.entries.slice(0, 132), baseline.entries);
  assert.deepEqual(targets.entries.map((entry) => entry.curriculumPriority), Array.from({ length: 3000 }, (_, i) => i + 1));
  const coverage = buildVocabularyCoverageReport(targets);
  assert.equal(coverage.activeEntries, 1500);
  assert.equal(coverage.receptiveEntries, 1500);
  assert.equal(coverage.curriculumCovered, 108);
  assert.equal(coverage.referenceOnlyCovered, 24);
  assert.equal(coverage.externalLibraryCovered, 2868);
  assert.equal(coverage.a1ActiveEntries, 700);
  assert.equal(coverage.a1ReceptiveEntries, 500);
  assert.equal(coverage.a2StageActiveEntries, 800);
  assert.equal(coverage.a2StageReceptiveEntries, 1000);
  assert.equal(coverage.countComplete, true);
  assert.equal(coverage.humanReviewComplete, false);
  for (const id of ["brothers", "people", "could", "better", "colour", "amy", "ben"]) {
    assert.ok(!targets.entries.some((entry) => entry.lexemeId === id), `${id} is not another canonical target`);
  }
});

test("all shipped library records have a meaning, provenance and honest pending pronunciation/QA", () => {
  assert.equal(library.entries.length, 3000);
  assert.equal(new Set(library.entries.map((entry) => entry.batchId)).size, 60);
  for (const entry of library.entries) {
    assert.match(entry.translationZhTw, /\p{Script=Han}/u, entry.lexemeId);
    assert.ok(entry.definitionEn.length >= 10, entry.lexemeId);
    assert.ok(entry.partOfSpeech.trim(), entry.lexemeId);
    assert.equal(entry.qaStatus, "pilot_review_required");
    assert.equal(entry.phoneticStatus, "pending");
    assert.equal(entry.audioStatus, "fallback");
    assert.ok(entry.sourceRefs.length > 0);
    assert.ok(!("audioSource" in entry), "do not invent a playable URL");
  }
  const byId = new Map(library.entries.map((entry) => [entry.lexemeId, entry]));
  assert.equal(byId.get("brother").displayEnglish, "brother");
  for (const [word, expected] of [["avocado", "酪梨"], ["pork", "豬肉"], ["noodle", "麵"], ["cashier", "收銀"], ["ginger", "薑"]]) {
    assert.ok(byId.get(word).translationZhTw.includes(expected), word);
  }
  for (const source of snapshot.selected.filter((entry) => entry.originalMeaning)) {
    assert.equal(byId.get(source.lemma).wordnetSynsetId, undefined, "editorial replacements must not claim a stale source sense");
  }
});

test("every batch including the final one is reachable and passive search is immutable", () => {
  const before = JSON.stringify({ targets, library });
  const visited = [];
  for (let page = 1; page <= 60; page += 1) {
    const result = buildVocabularyLibraryPage({ library, targets, page });
    assert.equal(result.totalEntries, 3000);
    assert.equal(result.entries.length, 50);
    visited.push(...result.entries.map(({ entry }) => entry.lexemeId));
  }
  assert.equal(new Set(visited).size, 3000);
  const last = library.entries.at(-1);
  const result = buildVocabularyLibraryPage({ library, targets, query: last.displayEnglish.toUpperCase() });
  assert.ok(result.entries.some(({ entry }) => entry.lexemeId === last.lexemeId));
  assert.equal(JSON.stringify({ targets, library }), before);
});

test("the offline generator reproduces the shipped target, library and manifest bytes", () => {
  const output = execFileSync(process.execPath, ["--experimental-strip-types", "scripts/build-vocabulary-catalog.mjs", "--check"], { cwd: root, encoding: "utf8", windowsHide: true });
  assert.match(output, /verified: 3000 canonical lexemes/);
});

test("distribution includes full source notices and exact pinned input hashes", () => {
  const sources = read("data-sources/vocabulary-3000/sources.json");
  assert.equal(sources.sources.length, 4);
  for (const source of sources.sources) assert.match(source.sha256, /^[a-f0-9]{64}$/);
  for (const file of ["README.md", "wordnet-3.0.txt", "chinese-open-wordnet.txt", "opencc-js-mit.txt", "opencc-third-party.md"]) {
    const content = fs.readFileSync(path.join(root, "public/licenses/vocabulary-3000", file), "utf8");
    assert.ok(content.length > 500, file);
  }
});

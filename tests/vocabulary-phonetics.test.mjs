import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import {
  buildVocabularyPhoneticIndex,
  validateVocabularyPhonetics,
} from "../app/vocabulary-phonetics.ts";

const root = process.cwd();
const readJson = async (relativePath) =>
  JSON.parse(await readFile(path.join(root, relativePath), "utf8"));

const [phonetics, targets, manifest, mapping] = await Promise.all([
  readJson("public/data/vocabulary-phonetics-v1.json"),
  readJson("public/data/vocabulary-targets-v2.json"),
  readJson("data-sources/vocabulary-3000/phonetics/source-manifest.json"),
  readJson("data-sources/vocabulary-3000/phonetics/arpabet-to-kk-v1.json"),
]);

test("phonetic supplement covers every canonical vocabulary target", () => {
  const report = validateVocabularyPhonetics(phonetics, targets.entries);
  assert.deepEqual(report, { valid: true, errors: [] });
  assert.equal(phonetics.targetCount, 3000);
  assert.equal(phonetics.missingCount, 0);
  assert.equal(phonetics.entries.length, 3000);
});

test("phonetic supplement is pinned to the reproducible CMUdict source", () => {
  assert.equal(phonetics.sourceVersion, manifest.sourceVersion);
  assert.equal(phonetics.sourceRevision, manifest.sourceRevision);
  assert.equal(phonetics.sourceSha256, manifest.sourceSha256);
  assert.equal(phonetics.inputSourceFile, manifest.snapshotFile);
  assert.equal(phonetics.inputSourceSha256, manifest.snapshotSha256);
  assert.equal(phonetics.sourceSnapshotSha256, manifest.snapshotSha256);
  assert.equal(phonetics.mappingId, mapping.mappingId);
  assert.equal(phonetics.mappingStatus, "derived_review_required");
  assert.equal(phonetics.candidateStatus, "pilot_review_required");
  assert.equal(phonetics.phoneticQaStatus, "candidate_only");
  assert.equal(phonetics.audioStatus, "unchanged");
  assert.match(phonetics.stressPolicy, /monosyllables_unmarked/);
  assert.equal(Object.keys(mapping.phones).length, 39);
});

test("homograph pronunciation variants remain visible and unselected", () => {
  const index = buildVocabularyPhoneticIndex(phonetics);
  for (const lexemeId of ["read", "live", "lead"]) {
    const entry = index.get(lexemeId);
    assert.ok(entry, `${lexemeId} must be covered`);
    assert.ok(entry.variants.length > 1, `${lexemeId} must retain variants`);
    assert.equal(entry.status, "variant_review_required");
    assert.deepEqual(
      entry.variants.map((variant) => variant.variantIndex),
      entry.variants.map((_, index) => index + 1),
    );
    for (const variant of entry.variants) {
      assert.equal(variant.selectionStatus, "not_selected");
      assert.equal(variant.candidateStatus, "derived_review_required");
      assert.equal(variant.syllabificationStatus, "heuristic_candidate");
      assert.equal(variant.stressPlacementStatus, "heuristic_candidate");
      assert.match(variant.stressPlacementNote, /候選/);
      assert.match(variant.arpabet, /^[A-Z]{1,3}[012]?(?:\s+[A-Z]{1,3}[012]?)*$/);
      assert.match(variant.ipaCandidate, /^\/.+\/$/);
      assert.match(variant.kkCandidate, /^\/.+\/$/);
    }
  }
});

test("stress candidates are placed at syllable onsets", () => {
  const index = buildVocabularyPhoneticIndex(phonetics);
  const expected = {
    apple: ["/ˈæpəl/", 2, [1]],
    about: ["/əˈbaʊt/", 2, [2]],
    before: ["/bɪˈfɔɹ/", 2, [2]],
    teacher: ["/ˈtitʃɚ/", 2, [1]],
    computer: ["/kəmˈpjutɚ/", 3, [2]],
    record: ["/ɹəˈkɔɹd/", 2, [2]],
    read: ["/ɹɛd/", 1, [1]],
    banana: ["/bəˈnænə/", 3, [2]],
    important: ["/ˌɪmˈpɔɹtənt/", 3, [1, 2]],
    remember: ["/ɹɪˈmɛmbɚ/", 3, [2]],
    understand: ["/ˌʌndɚˈstænd/", 3, [1, 3]],
  };
  for (const [lexemeId, [ipa, syllableCount, stressIndexes]] of Object.entries(expected)) {
    const variant = index.get(lexemeId)?.variants[0];
    assert.ok(variant, `${lexemeId} must be covered`);
    assert.equal(variant.ipaCandidate, ipa);
    assert.equal(variant.syllableCount, syllableCount);
    assert.deepEqual(variant.stressSyllableIndexes, stressIndexes);
    if (lexemeId === "computer") assert.equal(variant.kkCandidate, "/kəmˈpjutɚ/");
    if (lexemeId === "important") assert.equal(variant.kkCandidate, "/ˌɪmˈpɔrtənt/");
    if (lexemeId === "remember") assert.equal(variant.kkCandidate, "/rɪˈmɛmbɚ/");
    if (lexemeId === "understand") assert.equal(variant.kkCandidate, "/ˌʌndɚˈstænd/");
    if (syllableCount === 1) assert.doesNotMatch(variant.ipaCandidate, /ˈ|ˌ/);
  }
});

test("candidate output never upgrades audio or human QA", () => {
  for (const entry of phonetics.entries) {
    assert.notEqual(entry.status, "source_missing");
    for (const variant of entry.variants) {
      assert.equal(variant.selectionStatus, "not_selected");
      assert.notEqual(variant.candidateStatus, "approved");
      assert.notEqual(variant.candidateStatus, "human_reviewed");
    }
  }
});

test("phonetic validator rejects malformed candidate records", () => {
  const malformed = structuredClone(phonetics);
  malformed.entries[0].variants[0].arpabet = "FAKE1";
  const report = validateVocabularyPhonetics(malformed, targets.entries);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("ARPAbet")));
});

test("phonetic validator rejects an unknown or swapped target ID", () => {
  const malformed = structuredClone(phonetics);
  malformed.entries[0].lexemeId = "not-a-formal-target";
  const report = validateVocabularyPhonetics(malformed, targets.entries);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("不是正式 vocabulary target ID")));
});

test("phonetic validator keeps input source path and hash paired", () => {
  const malformed = structuredClone(phonetics);
  malformed.inputSourceFile = malformed.sourceFile;
  malformed.inputSourceSha256 = malformed.sourceSnapshotSha256;
  const report = validateVocabularyPhonetics(malformed, targets.entries);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("來源或 mapping")));
});

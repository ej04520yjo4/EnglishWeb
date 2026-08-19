import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createEmptyLevelProgress,
  createEmptyMultiLevelProgress,
  migrateProgressToV6,
} from "../app/curriculum/progress.ts";
import {
  loadAvailableCourseLevels,
  loadCourseLevel,
} from "../app/curriculum/loader.ts";
import {
  buildVocabularyCoverageReport,
  canonicalizeLexemeId,
  parseVocabularyTargets,
  uniqueCanonicalLexemes,
  validateVocabularyTargets,
} from "../app/vocabulary-targets.ts";
import {
  canCreditSpellingCorrect,
  deriveVocabularyMasteryState,
  recordGlobalVocabularyEvidence,
} from "../app/vocabulary-progress.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readBuffer = (relativePath) => fs.readFileSync(path.join(root, relativePath));
const readText = (relativePath) => readBuffer(relativePath).toString("utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const targets = parseVocabularyTargets(
  readJson("public/data/vocabulary-targets-v1.json"),
);
const catalog = readJson("public/data/course-catalog.json");

const protectedHashes = {
  "public/data/a1-course-v3.csv": "425625f5765318521ad78efb21461e41f7274d8de4faf6ab0f0c0ac719be7932",
  "public/data/a2-course-v1.csv": "1049e810a535f65261b06a55438bbdeb72c42b33d0d4f3fadd49c3cbaceccfa7",
  "public/data/a1-pattern-exercises.json": "a7fd2a2e6eeb262fc0fdeaa0b49ceff655998db5f11f85e72d31aa57bee4a5da",
  "public/data/a1-reading-exercises.json": "fb666547af28b97607e9de45593731a09a0612543ce10fcda5c263a84feec99c",
  "public/data/a2-pattern-exercises.json": "f586f42cf707912970ecf7fd51d2f85b1d1a03724977e63e8d5dbb2ce088c8e9",
  "public/data/a2-reading-exercises.json": "3bcde8b4506147791e9d3df88c1be84b304c2a8e387458e4305b52f57beed3d5",
};

const response = (body, status = 200) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

test("keeps B1 and B2 disabled while runtime loading only A1 and A2", async () => {
  assert.deepEqual(
    catalog.levels.map((entry) => [entry.level, entry.status]),
    [["A1", "production"], ["A2", "pilot"], ["B1", "disabled"], ["B2", "disabled"]],
  );
  const requested = [];
  const files = {
    "/data/course-catalog.json": catalog,
    "/data/a1-course-v3.csv": readText("public/data/a1-course-v3.csv"),
    "/data/a2-course-v1.csv": readText("public/data/a2-course-v1.csv"),
  };
  const result = await loadAvailableCourseLevels(async (url) => {
    requested.push(url);
    return url in files ? response(files[url]) : response("", 404);
  });
  assert.ok(result.levels.A1);
  assert.ok(result.levels.A2);
  assert.equal(result.levels.B1, undefined);
  assert.equal(result.levels.B2, undefined);
  assert.ok(!requested.some((url) => /b[12]-course/.test(url)));
  await assert.rejects(
    () => loadCourseLevel(catalog, "B1", async () => response("", 500)),
    /B1 課程資料目前停用/,
  );
});

test("keeps protected A1 and A2 source content unchanged across line endings", () => {
  for (const [relativePath, expected] of Object.entries(protectedHashes)) {
    const canonicalBytes = readText(relativePath).replace(/\r\n/g, "\n");
    assert.equal(createHash("sha256").update(canonicalBytes).digest("hex"), expected);
  }
});

test("builds a partial baseline from A1, A2, and reference-only lexemes", () => {
  const report = buildVocabularyCoverageReport(targets);
  assert.equal(targets.status, "partial_review_required");
  assert.equal(report.targetEntries, 126);
  assert.equal(report.activeEntries, 100);
  assert.equal(report.receptiveEntries, 26);
  assert.equal(report.curriculumCovered, 100);
  assert.equal(report.referenceOnlyCovered, 26);
  assert.equal(report.missingEntries, 2874);
  assert.ok(!targets.entries.some((entry) => entry.lexemeId === "amy"));
  assert.ok(!targets.entries.some((entry) => entry.lexemeId === "ben"));
  const iTarget = targets.entries.find((entry) => entry.lexemeId === "i");
  assert.ok(iTarget.sourceLexemeIds.includes("me"));
  assert.ok(!targets.entries.some((entry) => entry.lexemeId === "me"));
});

test("canonical lexeme counting merges forms and senses and excludes chunks", () => {
  const rows = [
    { lexeme_id: "go", answer: "go", sense_id: "go-place", chunk_id: "go-to-work" },
    { lexeme_id: "go", answer: "went", sense_id: "go-past", chunk_id: "go-home" },
    { lexeme_id: "buy", answer: "buy" },
    { lexeme_id: "buy", answer: "bought" },
    { lexeme_id: "cheap", answer: "cheap" },
    { lexeme_id: "cheap", answer: "cheaper" },
    { lexeme_id: "leave", answer: "leave" },
    { lexeme_id: "leave", answer: "leaves" },
    { lexeme_id: "take", answer: "take", sense_id: "take-bus" },
    { lexeme_id: "take", answer: "take", sense_id: "take-medicine" },
  ];
  assert.deepEqual(
    [...uniqueCanonicalLexemes(rows)].sort(),
    ["buy", "cheap", "go", "leave", "take"],
  );
  assert.ok(!targets.entries.some((entry) => entry.lexemeId.includes(" ")));
});

test("rejects duplicate targets and multiword lemmas", () => {
  const duplicate = structuredClone(targets);
  duplicate.entries.push(structuredClone(duplicate.entries[0]));
  assert.equal(validateVocabularyTargets(duplicate).valid, false);
  const multiword = structuredClone(targets);
  multiword.entries[0].lemma = "take care";
  assert.equal(validateVocabularyTargets(multiword).valid, false);
  const conflict = structuredClone(targets);
  conflict.entries[0].lemma = "different";
  assert.equal(validateVocabularyTargets(conflict).valid, false);

  const aliasConflict = structuredClone(targets);
  aliasConflict.entries[1].sourceLexemeIds.push(
    aliasConflict.entries[0].sourceLexemeIds[0],
  );
  assert.equal(validateVocabularyTargets(aliasConflict).valid, false);

  assert.equal(canonicalizeLexemeId("Don’t"), "don't");
  assert.equal(canonicalizeLexemeId("mother–in–law"), "mother-in-law");
});

test("allows partial targets but enforces every complete goal", () => {
  assert.equal(validateVocabularyTargets(targets).valid, true);
  const incomplete = structuredClone(targets);
  incomplete.status = "complete";
  const report = validateVocabularyTargets(incomplete);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("3000")));
  assert.ok(report.errors.some((error) => error.includes("1500 個 active")));
  assert.ok(report.errors.some((error) => error.includes("1500 個 receptive")));
  assert.ok(report.errors.some((error) => error.includes("A1 累計")));
  assert.ok(report.errors.some((error) => error.includes("人工 QA")));
  assert.ok(report.errors.some((error) => error.includes("待確認授權")));
});

test("migrates schemas 3, 4, and 5 to v6 without inventing mastery", () => {
  const legacyA1 = { ...createEmptyLevelProgress(), schemaVersion: 3 };
  legacyA1.completedLessonIds = ["a1-u1-l1"];
  const v3 = migrateProgressToV6(legacyA1);
  assert.deepEqual(v3.levelProgress.A1.completedLessonIds, ["a1-u1-l1"]);
  assert.deepEqual(v3.vocabularyProgress, {});

  const base = createEmptyMultiLevelProgress();
  base.levelProgress.A1.completedLessonIds = ["a1-u1-l1"];
  base.levelProgress.A2.completedLessonIds = ["a2-u01-l01"];
  base.levelProgress.B1.completedLessonIds = ["b1-u01-l01"];
  base.levelProgress.B2.completedLessonIds = ["b2-u01-l01"];
  base.passedLevelIds = ["A1"];
  for (const schemaVersion of [4, 5]) {
    const legacy = structuredClone(base);
    legacy.schemaVersion = schemaVersion;
    const migrated = migrateProgressToV6(legacy);
    assert.deepEqual(migrated.passedLevelIds, ["A1"]);
    assert.deepEqual(migrated.levelProgress.A2.completedLessonIds, ["a2-u01-l01"]);
    assert.deepEqual(migrated.levelProgress.B2.completedLessonIds, ["b2-u01-l01"]);
    assert.deepEqual(migrated.vocabularyProgress, {});
  }
});

test("records explicit reference exposure without other mastery evidence", () => {
  const progress = recordGlobalVocabularyEvidence({}, {
    lexemeIds: ["monday"],
    kind: "exposure",
    evidenceId: "reference:days-of-week:monday:2026-07-31",
    studiedAt: "2026-07-31T10:00:00.000Z",
    sourceLevel: "A1",
  });
  const evidence = progress.monday;
  assert.equal(deriveVocabularyMasteryState(evidence), "exposed");
  assert.equal(evidence.recognitionAttemptEvidenceIds.length, 0);
  assert.equal(evidence.spellingAttemptEvidenceIds.length, 0);
  assert.equal(evidence.applicationAttemptEvidenceIds.length, 0);
});

test("deduplicates evidence and shares one canonical lexeme across levels", () => {
  const input = {
    lexemeIds: ["Go", "go"],
    kind: "spellingAttempt",
    evidenceId: "spelling:a1-u1-l1-t01:2026-07-31:1",
    studiedAt: "2026-07-31T10:00:00.000Z",
    sourceLevel: "A1",
  };
  const first = recordGlobalVocabularyEvidence({}, input);
  const duplicate = recordGlobalVocabularyEvidence(first, input);
  const a2 = recordGlobalVocabularyEvidence(duplicate, {
    ...input,
    evidenceId: "spelling:a2-u01-l01-t01:2026-08-01:1",
    studiedAt: "2026-08-01T10:00:00.000Z",
    sourceLevel: "A2",
  });
  assert.equal(a2.go.spellingAttemptEvidenceIds.length, 2);
  assert.deepEqual(a2.go.sourceLevels, ["A1", "A2"]);
  assert.equal(Object.keys(a2).length, 1);
});

test("does not credit revealed or pasted spelling as clean evidence", () => {
  assert.equal(
    canCreditSpellingCorrect({ correct: true, answerRevealed: false, usedPaste: false }),
    true,
  );
  assert.equal(
    canCreditSpellingCorrect({ correct: true, answerRevealed: true, usedPaste: false }),
    false,
  );
  assert.equal(
    canCreditSpellingCorrect({ correct: true, answerRevealed: false, usedPaste: true }),
    false,
  );
});

test("records recognition and sentence application evidence separately", () => {
  let progress = recordGlobalVocabularyEvidence({}, {
    lexemeIds: ["book"],
    kind: "recognitionAttempt",
    evidenceId: "recognition:a1-u2-l1-reading-01:2026-07-31",
    studiedAt: "2026-07-31T10:00:00.000Z",
    sourceLevel: "A1",
  });
  progress = recordGlobalVocabularyEvidence(progress, {
    lexemeIds: ["book"],
    kind: "recognitionCorrect",
    evidenceId: "recognition:a1-u2-l1-reading-01:2026-07-31",
    studiedAt: "2026-07-31T10:00:00.000Z",
    sourceLevel: "A1",
  });
  progress = recordGlobalVocabularyEvidence(progress, {
    lexemeIds: ["book"],
    kind: "applicationAttempt",
    evidenceId: "rebuild:a1-u2-l1-s01:2026-07-31:1",
    studiedAt: "2026-07-31T10:00:00.000Z",
    sourceLevel: "A1",
  });
  progress = recordGlobalVocabularyEvidence(progress, {
    lexemeIds: ["book"],
    kind: "applicationCorrect",
    evidenceId: "rebuild:a1-u2-l1-s01:2026-07-31:1",
    studiedAt: "2026-07-31T10:00:00.000Z",
    sourceLevel: "A1",
  });
  assert.equal(progress.book.recognitionAttemptEvidenceIds.length, 1);
  assert.equal(progress.book.recognitionCorrectEvidenceIds.length, 1);
  assert.equal(progress.book.applicationAttemptEvidenceIds.length, 1);
  assert.equal(progress.book.applicationCorrectEvidenceIds.length, 1);
});

test("requires clean cross-date recognition, spelling, and application for mastery", () => {
  let progress = {};
  const record = (kind, id, date) => {
    progress = recordGlobalVocabularyEvidence(progress, {
      lexemeIds: ["go"],
      kind,
      evidenceId: id,
      studiedAt: `${date}T10:00:00.000Z`,
      sourceLevel: "A1",
    });
  };
  record("recognitionAttempt", "recognition:q1:2026-07-31", "2026-07-31");
  record("recognitionCorrect", "recognition:q1:2026-07-31", "2026-07-31");
  record("recognitionCorrect", "recognition:q2:2026-08-01", "2026-08-01");
  assert.equal(deriveVocabularyMasteryState(progress.go), "receptive");
  record("spellingAttempt", "spelling:t1:2026-07-31:1", "2026-07-31");
  record("spellingCorrect", "spelling:t1:2026-07-31:1", "2026-07-31");
  record("spellingCorrect", "spelling:t2:2026-08-01:1", "2026-08-01");
  assert.equal(deriveVocabularyMasteryState(progress.go), "receptive");
  record("applicationCorrect", "rebuild:s1:2026-08-01", "2026-08-01");
  assert.equal(deriveVocabularyMasteryState(progress.go), "active");
});

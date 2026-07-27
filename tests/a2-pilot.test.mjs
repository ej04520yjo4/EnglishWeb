import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildCourseUnitsFromRows as buildA1Units,
  parseA1MvpCsv,
} from "../app/a1-mvp-data.ts";
import {
  validatePatternExerciseData,
  validateReadingExerciseData,
} from "../app/a1-exercises.ts";
import {
  canAccessLevel,
  createEmptyMultiLevelProgress,
  migrateProgressToV4,
  updateSelectedLevelProgress,
} from "../app/curriculum/progress.ts";
import {
  loadCurriculumCatalog,
  validateCurriculumCatalog,
} from "../app/curriculum/catalog.ts";
import {
  loadAvailableCourseLevels,
  loadCourseLevel,
} from "../app/curriculum/loader.ts";
import {
  buildCourseUnitsFromRows,
  findCrossLevelIdCollisions,
  parseCourseCsv,
  validateCourseRows,
} from "../app/curriculum/validation.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const a1Text = readText("public/data/a1-course-v3.csv");
const a2Text = readText("public/data/a2-course-v1.csv");
const a1Rows = parseA1MvpCsv(a1Text);
const a2Rows = parseCourseCsv(a2Text);
const catalogJson = readJson("public/data/course-catalog.json");
const a2Patterns = readJson("public/data/a2-pattern-exercises.json");
const a2Reading = readJson("public/data/a2-reading-exercises.json");

const response = (body, status = 200) =>
  new Response(
    typeof body === "string" ? body : JSON.stringify(body),
    {
      status,
      headers: {
        "content-type":
          typeof body === "string"
            ? "text/plain; charset=utf-8"
            : "application/json",
      },
    },
  );

const curriculumFetcher = async (url) => {
  const files = {
    "/data/course-catalog.json": catalogJson,
    "/data/a1-course-v3.csv": a1Text,
    "/data/a2-course-v1.csv": a2Text,
  };
  return url in files ? response(files[url]) : response("", 404);
};

test("keeps A1 at 8 units, 32 lessons, and 145 occurrences", () => {
  const units = buildA1Units(a1Rows);
  assert.equal(units.length, 8);
  assert.equal(
    units.flatMap((unit) => unit.lessons).length,
    32,
  );
  assert.equal(a1Rows.length, 145);
});

test("loads a catalog containing production A1 and pilot A2", async () => {
  const catalog = validateCurriculumCatalog(catalogJson);
  assert.deepEqual(
    catalog.levels.map((entry) => [entry.level, entry.status]),
    [
      ["A1", "production"],
      ["A2", "pilot"],
    ],
  );
  const loaded = await loadCurriculumCatalog(curriculumFetcher);
  assert.equal(loaded.levels[1].prerequisiteLevel, "A1");
});

test("loads the A2 pilot as 1 unit and 4 lessons", async () => {
  const catalog = await loadCurriculumCatalog(curriculumFetcher);
  const level = await loadCourseLevel(
    catalog,
    "A2",
    curriculumFetcher,
  );
  assert.equal(level.units.length, 1);
  assert.equal(level.units[0].lessons.length, 4);
  assert.equal(level.rows.length, 25);
  assert.equal(level.status, "pilot");
});

test("keeps every cross-level structural ID collision-free", () => {
  assert.deepEqual(findCrossLevelIdCollisions(a1Rows, a2Rows), []);
});

test("keeps every A2 answer to one word and rebuilds all core sentences", () => {
  assert.ok(
    a2Rows.every((row) =>
      /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer),
    ),
  );
  const report = validateCourseRows(a2Rows, {
    expectedLevel: "A2",
    expectedUnits: 1,
    expectedLessons: 4,
    rejectProductionQaForPilot: true,
  });
  assert.equal(report.valid, true, report.validationErrors.join("\n"));
  const units = buildCourseUnitsFromRows(
    a2Rows,
    "a2-course-v1.csv",
  );
  units[0].lessons.forEach((lesson) => {
    const punctuation = lesson.sentence.match(/[.!?]$/)?.[0] ?? ".";
    assert.equal(
      `${lesson.tokens.map((token) => token.answer).join(" ")}${punctuation}`,
      lesson.sentence,
    );
  });
});

test("validates A2 transfer lexemes, chunks, slots, and non-source variations", () => {
  const report = validatePatternExerciseData(
    a2Patterns,
    a2Rows,
    "A2",
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
  const sourceById = new Map(
    a2Rows.map((row) => [row.sentence_id, row.sentence]),
  );
  a2Patterns.patterns.forEach((pattern) => {
    assert.equal(pattern.examples.length, 2);
    pattern.examples.forEach((example) => {
      assert.notEqual(
        example.sentence.toLowerCase(),
        sourceById.get(example.sourceSentenceId)?.toLowerCase(),
      );
      assert.ok(example.requiredLexemeIds.length > 0);
    });
  });
});

test("keeps A2 reading answers supported and distractors unique", () => {
  const report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
  const passage = a2Reading.passages[0];
  const sentenceById = new Map(
    passage.sentences.map((sentence) => [
      sentence.id,
      sentence.sentence.toLowerCase(),
    ]),
  );
  passage.questions.forEach((question) => {
    assert.ok(
      sentenceById
        .get(question.sourceSentenceId)
        .includes(
          question.correctAnswer
            .replace(/[.!?]$/g, "")
            .toLowerCase(),
        ),
    );
    assert.equal(
      new Set(question.options).size,
      question.options.length,
    );
    assert.equal(
      question.options.filter(
        (option) => option === question.correctAnswer,
      ).length,
      1,
    );
  });
});

test("migrates schemaVersion 3 to 4 without changing A1 data", () => {
  const legacy = {
    schemaVersion: 3,
    completedLessonIds: ["a1-u1-l1"],
    passedUnitIds: ["a1-u1"],
    levelPassed: true,
    totalAttempts: 12,
    correctAnswers: 9,
    totalSeconds: 321,
    pasteCount: 2,
    studyDates: ["2026-07-27"],
    reviewItems: {
      "a1-u1-l1-t01": {
        tokenId: "a1-u1-l1-t01",
        answer: "I",
        prompt: "我",
        familiarity: "熟悉",
        dueAt: "2026-08-01T00:00:00.000Z",
        intervalDays: 5,
        successfulDays: 1,
      },
    },
    lexemeProgress: {},
    senseProgress: {},
    sentencePatternProgress: {},
    tokenProgress: {
      "a1-u1-l1-t01": {
        attempts: 2,
        hintsUsed: 1,
        answerRevealed: false,
        elapsedSeconds: 8,
        audioReplays: 1,
        usedPaste: false,
        correctAnswers: 1,
        lastAnsweredAt: "2026-07-27T00:00:00.000Z",
      },
    },
    sentenceStats: {},
    patternStats: {},
    passageStats: {},
    tokenHintLevels: {},
    chunkHintLevels: {},
    patternHintLevels: {},
    reviewExerciseTypes: {},
  };
  const migrated = migrateProgressToV4(legacy);
  assert.equal(migrated.schemaVersion, 4);
  assert.equal(migrated.selectedLevel, "A1");
  assert.deepEqual(
    migrated.levelProgress.A1.completedLessonIds,
    legacy.completedLessonIds,
  );
  assert.deepEqual(
    migrated.levelProgress.A1.passedUnitIds,
    legacy.passedUnitIds,
  );
  assert.deepEqual(
    migrated.levelProgress.A1.tokenProgress,
    legacy.tokenProgress,
  );
  assert.equal(
    migrated.levelProgress.A1.reviewItems["a1-u1-l1-t01"].dueAt,
    legacy.reviewItems["a1-u1-l1-t01"].dueAt,
  );
  assert.equal(migrated.levelProgress.A1.totalAttempts, 12);
  assert.deepEqual(migrated.passedLevelIds, ["A1"]);
  assert.deepEqual(
    migrated.levelProgress.A2.completedLessonIds,
    [],
  );
});

test("keeps A1 and A2 progress isolated and restorable", () => {
  const initial = createEmptyMultiLevelProgress();
  initial.levelProgress.A1.completedLessonIds = ["a1-u1-l1"];
  const selectedA2 = { ...initial, selectedLevel: "A2" };
  const updated = updateSelectedLevelProgress(
    selectedA2,
    (progress) => ({
      ...progress,
      completedLessonIds: ["a2-u01-l01"],
    }),
  );
  assert.deepEqual(updated.levelProgress.A1.completedLessonIds, [
    "a1-u1-l1",
  ]);
  assert.deepEqual(updated.levelProgress.A2.completedLessonIds, [
    "a2-u01-l01",
  ]);
  assert.deepEqual(
    migrateProgressToV4(JSON.parse(JSON.stringify(updated))),
    updated,
  );
});

test("enforces formal A2 unlock while allowing a non-mutating pilot entry", () => {
  const passedLevelIds = [];
  assert.equal(canAccessLevel("A2", passedLevelIds, false), false);
  assert.equal(canAccessLevel("A2", passedLevelIds, true), true);
  assert.deepEqual(passedLevelIds, []);
  assert.equal(canAccessLevel("A2", ["A1"], false), true);
});

test("isolates an A2 loading failure from a valid A1 level", async () => {
  const failedA2Fetcher = async (url) => {
    if (url === "/data/a2-course-v1.csv") {
      return response("", 500);
    }
    return curriculumFetcher(url);
  };
  const result = await loadAvailableCourseLevels(failedA2Fetcher);
  assert.equal(result.levels.A1.units.length, 8);
  assert.equal(result.levels.A2, undefined);
  assert.match(result.errors.A2, /A2 課程 CSV 載入失敗/);
});

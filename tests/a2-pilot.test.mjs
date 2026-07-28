import assert from "node:assert/strict";
import crypto from "node:crypto";
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
  COURSE_CSV_HEADERS,
  findCrossLevelIdCollisions,
  parseCourseCsv,
  serializeCourseCsv,
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

test("loads the A2 pilot as 2 units and 8 lessons", async () => {
  const catalog = await loadCurriculumCatalog(curriculumFetcher);
  const level = await loadCourseLevel(
    catalog,
    "A2",
    curriculumFetcher,
  );
  assert.equal(level.units.length, 2);
  assert.equal(level.units[0].lessons.length, 4);
  assert.equal(level.units[1].lessons.length, 4);
  assert.equal(level.rows.length, 53);
  assert.equal(level.status, "pilot");
});

test("keeps A2 unit 1 at 4 lessons and 25 unchanged occurrences", () => {
  const unitOneRows = a2Rows.filter(
    (row) => row.unit_id === "a2-u01",
  );
  const units = buildCourseUnitsFromRows(
    unitOneRows,
    "a2-course-v1.csv",
  );
  const canonical = unitOneRows.map((row) =>
    COURSE_CSV_HEADERS.map((header) => row[header] ?? ""),
  );

  assert.equal(units.length, 1);
  assert.equal(units[0].lessons.length, 4);
  assert.equal(unitOneRows.length, 25);
  assert.deepEqual(
    units[0].lessons.map((lesson) => lesson.sentence),
    [
      "I watched TV last night.",
      "I went to the store yesterday.",
      "I am going to play badminton tomorrow.",
      "Would you like to go with me?",
    ],
  );
  assert.equal(
    crypto
      .createHash("sha256")
      .update(JSON.stringify(canonical))
      .digest("hex"),
    "0dc7a5643216f063b52f486bf8fc70290de94ed8880450aae81f606b0ffc2c94",
  );
});

test("builds A2 unit 2 as four ordered shopping lessons", () => {
  const unit = buildCourseUnitsFromRows(
    a2Rows,
    "a2-course-v1.csv",
  ).find((item) => item.id === "a2-u02");

  assert.ok(unit);
  assert.equal(unit.title, "購物與比較");
  assert.match(unit.description, /Shopping and Comparing/);
  assert.deepEqual(
    unit.lessons.map((lesson) => [
      lesson.id,
      lesson.number,
      lesson.title,
      lesson.sentence,
    ]),
    [
      [
        "a2-u02-l01",
        1,
        "詢問價格",
        "How much is this shirt?",
      ],
      [
        "a2-u02-l02",
        2,
        "比較價格",
        "This shirt is cheaper than that one.",
      ],
      [
        "a2-u02-l03",
        3,
        "詢問尺寸",
        "Do you have this shirt in a larger size?",
      ],
      [
        "a2-u02-l04",
        4,
        "付款方式",
        "I would like to pay by card.",
      ],
    ],
  );
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
    expectedUnits: 2,
    expectedLessons: 8,
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

test("keeps every A2 unit 2 answer to one word and rebuilds its core sentence", () => {
  const unitRows = a2Rows.filter(
    (row) => row.unit_id === "a2-u02",
  );
  const units = buildCourseUnitsFromRows(
    unitRows,
    "a2-course-v1.csv",
  );

  assert.equal(unitRows.length, 28);
  assert.ok(
    unitRows.every((row) =>
      /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer),
    ),
  );
  units[0].lessons.forEach((lesson) => {
    const punctuation = lesson.sentence.match(/[.!?]$/)?.[0] ?? ".";
    assert.equal(
      `${lesson.tokens.map((token) => token.answer).join(" ")}${punctuation}`,
      lesson.sentence,
    );
  });
});

test("limits A2 unit 2 to at most four genuinely new lexemes per lesson", () => {
  const counts = Object.fromEntries(
    ["a2-u02-l01", "a2-u02-l02", "a2-u02-l03", "a2-u02-l04"].map(
      (lessonId) => [
        lessonId,
        new Set(
          a2Rows
            .filter(
              (row) =>
                row.lesson_id === lessonId &&
                row.is_new_word === "TRUE",
            )
            .map((row) => row.lexeme_id),
        ).size,
      ],
    ),
  );

  assert.deepEqual(counts, {
    "a2-u02-l01": 3,
    "a2-u02-l02": 3,
    "a2-u02-l03": 3,
    "a2-u02-l04": 2,
  });
  assert.ok(Object.values(counts).every((count) => count <= 4));
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

test("gives every A2 unit 2 lesson recognition, two transfers, and text response", () => {
  const lessonIds = [
    "a2-u02-l01",
    "a2-u02-l02",
    "a2-u02-l03",
    "a2-u02-l04",
  ];

  for (const lessonId of lessonIds) {
    assert.equal(
      a2Reading.recognition.filter(
        (exercise) => exercise.lessonId === lessonId,
      ).length,
      1,
    );
    assert.equal(
      a2Reading.textResponses.filter(
        (exercise) => exercise.lessonId === lessonId,
      ).length,
      1,
    );
    assert.equal(
      a2Patterns.patterns.flatMap((pattern) =>
        pattern.examples.filter(
          (example) => example.practiceLessonId === lessonId,
        ),
      ).length,
      2,
    );
  }
});

test("keeps A2 unit 2 transfer data inside learned slot allowlists", () => {
  const report = validatePatternExerciseData(
    a2Patterns,
    a2Rows,
    "A2",
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));

  const unitTwoPatterns = a2Patterns.patterns.filter((pattern) =>
    pattern.examples.some((example) =>
      example.practiceLessonId.startsWith("a2-u02-"),
    ),
  );
  assert.equal(unitTwoPatterns.length, 4);
  unitTwoPatterns.forEach((pattern) => {
    assert.equal(pattern.qaStatus, "pilot_review_required");
    assert.equal(pattern.examples.length, 2);
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
  const passage = a2Reading.passages.find(
    (item) => item.passageId === "a2-u01-p01",
  );
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

test("adds a five-sentence A2 shopping passage with supported comprehension", () => {
  const passage = a2Reading.passages.find(
    (item) => item.passageId === "a2-u02-p01",
  );
  assert.ok(passage);
  assert.equal(passage.level, "A2");
  assert.equal(passage.qaStatus, "pilot_review_required");
  assert.ok(
    passage.sentences.length >= 5 && passage.sentences.length <= 6,
  );
  assert.equal(passage.questions.length, 5);
  assert.ok(
    passage.questions.some(
      (question) => question.evidenceSentenceIds?.length >= 2,
    ),
  );

  const report = validateReadingExerciseData(
    a2Reading,
    a2Rows,
    a2Patterns,
    a1Rows,
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
});

test("keeps every A2 unit 2 curriculum and exercise item in pilot review", () => {
  const rows = a2Rows.filter((row) => row.unit_id === "a2-u02");
  assert.ok(
    rows.every((row) => row.qa_status === "pilot_review_required"),
  );
  assert.ok(
    a2Reading.recognition
      .filter((item) => item.lessonId.startsWith("a2-u02-"))
      .every(
        (item) =>
          item.level === "A2" &&
          item.qaStatus === "pilot_review_required",
      ),
  );
  assert.ok(
    a2Reading.textResponses
      .filter((item) => item.lessonId.startsWith("a2-u02-"))
      .every(
        (item) =>
          item.level === "A2" &&
          item.qaStatus === "pilot_review_required",
      ),
  );
});

test("keeps A2 unit IDs collision-free across both pilot units", () => {
  const unitOneIds = new Set(
    a2Rows
      .filter((row) => row.unit_id === "a2-u01")
      .flatMap((row) => [
        row.unit_id,
        row.lesson_id,
        row.sentence_id,
        row.occurrence_id,
      ]),
  );
  const unitTwoIds = a2Rows
    .filter((row) => row.unit_id === "a2-u02")
    .flatMap((row) => [
      row.unit_id,
      row.lesson_id,
      row.sentence_id,
      row.occurrence_id,
    ]);
  assert.deepEqual(
    unitTwoIds.filter((id) => unitOneIds.has(id)),
    [],
  );
});

test("round-trips both A2 units without losing import fields", () => {
  const serialized = serializeCourseCsv(a2Rows);
  const restored = parseCourseCsv(serialized);
  assert.deepEqual(restored, a2Rows);
  assert.equal(
    new Set(restored.map((row) => row.unit_id)).size,
    2,
  );
  assert.equal(restored.length, 53);
});

test("rejects an invalid A2 unit 2 import without changing A1 rows", () => {
  const a1Before = JSON.stringify(a1Rows);
  const invalid = structuredClone(a2Rows);
  const target = invalid.find(
    (row) =>
      row.occurrence_id ===
      "a2-u02-l02-p01-s01-t04",
  );
  target.answer = "more cheap";

  const report = validateCourseRows(invalid, {
    expectedLevel: "A2",
    expectedRows: 53,
    expectedUnits: 2,
    expectedLessons: 8,
    rejectProductionQaForPilot: true,
  });
  assert.equal(report.valid, false);
  assert.ok(
    report.validationErrors.some((error) =>
      error.includes("answer 必須只有一個英文單字"),
    ),
  );
  assert.equal(JSON.stringify(a1Rows), a1Before);
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

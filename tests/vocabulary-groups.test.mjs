import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildCourseUnitsFromRows,
  parseA1MvpCsv,
} from "../app/a1-mvp-data.ts";
import { createEmptyLevelProgress } from "../app/curriculum/progress.ts";
import {
  buildVocabularyDataset,
  canShowVocabularyShortcut,
  createVocabularyCourseReturnContext,
  loadVocabularyDataset,
  validateVocabularyData,
  vocabularyGroupForLexeme,
  vocabularyItemMatchesSearch,
  vocabularyLearningState,
  vocabularyStatusMatchesFilter,
} from "../app/vocabulary-groups.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const readText = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readJson = (relativePath) => JSON.parse(readText(relativePath));

const a1Rows = parseA1MvpCsv(
  readText("public/data/a1-course-v3.csv"),
);
const groupData = readJson("public/data/vocabulary-groups-v1.json");
const referenceData = readJson(
  "public/data/reference-vocabulary-v1.json",
);
const dataset = buildVocabularyDataset(
  groupData,
  referenceData,
  a1Rows,
);
const days = dataset.groups.find(
  (group) => group.id === "days-of-week",
);
const times = dataset.groups.find(
  (group) => group.id === "times-of-day",
);
const months = dataset.groups.find(
  (group) => group.id === "months-of-year",
);
const family = dataset.groups.find(
  (group) => group.id === "family-members",
);

test("loads the four versioned vocabulary groups", () => {
  assert.equal(dataset.schemaVersion, 1);
  assert.equal(dataset.groups.length, 4);
  assert.deepEqual(
    dataset.groups.map((group) => group.id),
    [
      "days-of-week",
      "times-of-day",
      "months-of-year",
      "family-members",
    ],
  );
});

test("keeps group IDs and group order unique", () => {
  assert.equal(
    new Set(dataset.groups.map((group) => group.id)).size,
    dataset.groups.length,
  );
  assert.equal(
    new Set(dataset.groups.map((group) => group.order)).size,
    dataset.groups.length,
  );
});

test("keeps Monday through Sunday in the required order", () => {
  assert.deepEqual(
    days.items.map((item) => item.lexemeId),
    [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
  );
});

test("keeps morning through night in the required order", () => {
  assert.deepEqual(
    times.items.map((item) => item.lexemeId),
    ["morning", "noon", "afternoon", "evening", "night"],
  );
});

test("keeps January through December in the required order", () => {
  assert.deepEqual(
    months.items.map((item) => item.lexemeId),
    [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ],
  );
});

test("keeps the family-member sequence", () => {
  assert.deepEqual(
    family.items.map((item) => item.lexemeId),
    [
      "family",
      "mother",
      "father",
      "parent",
      "brother",
      "sister",
      "wife",
      "husband",
      "son",
      "daughter",
    ],
  );
});

test("resolves every vocabulary item with English, Chinese, and phonetics", () => {
  for (const group of dataset.groups) {
    for (const item of group.items) {
      assert.ok(item.displayEnglish);
      assert.ok(item.translationZhTw);
      assert.ok(item.kkUs || item.ipaUs);
      assert.ok(item.qaStatus);
    }
  }
});

test("prefers official course data over a matching reference entry", () => {
  const mondayRow = a1Rows.find(
    (row) => row.lexeme_id === "monday",
  );
  const withDuplicateReference = structuredClone(referenceData);
  withDuplicateReference.vocabulary.push({
    lexemeId: "monday",
    lemma: mondayRow.lemma,
    displayEnglish: mondayRow.answer,
    translationZhTw: mondayRow.prompt,
    kkUs: mondayRow.kk_us,
    ipaUs: mondayRow.ipa_standalone,
    usageNoteZhTw: "reference note",
    audioMethod: "pre_generated_audio",
    audioStatus: "ready",
    audioSource: "/reference-monday.mp3",
    license: "test-only",
    minimumLevel: "A1",
    contentStatus: "reference_only",
    qaStatus: "reference_review_required",
  });
  const resolved = buildVocabularyDataset(
    groupData,
    withDuplicateReference,
    a1Rows,
  );
  const monday = vocabularyGroupForLexeme(
    resolved,
    "monday",
  ).items.find((item) => item.lexemeId === "monday");
  assert.equal(monday.source, "course");
  assert.equal(monday.audioSource, "");
});

test("uses formal course records for May and taught family words", () => {
  const formalItems = [
    months.items.find((item) => item.lexemeId === "may"),
    family.items.find((item) => item.lexemeId === "mother"),
    family.items.find((item) => item.lexemeId === "brother"),
    family.items.find((item) => item.lexemeId === "wife"),
  ];
  assert.ok(formalItems.every((item) => item?.source === "course"));
  assert.equal(
    family.items.find((item) => item.lexemeId === "brother")
      .displayEnglish,
    "brothers",
  );
});

test("keeps new month and family gaps reference-only", () => {
  assert.equal(referenceData.vocabulary.length, 27);
  assert.equal(
    months.items.find((item) => item.lexemeId === "january")
      .source,
    "reference",
  );
  assert.equal(
    family.items.find((item) => item.lexemeId === "father")
      .source,
    "reference",
  );
  assert.ok(
    referenceData.vocabulary.every(
      (item) =>
        item.contentStatus === "reference_only" &&
        item.qaStatus === "reference_review_required",
    ),
  );
});

test("rejects a vocabulary item that cannot resolve to course or reference data", () => {
  const invalid = structuredClone(groupData);
  invalid.groups[0].items[6].lexemeId = "missing-sunday";
  invalid.groups[0].triggerLexemeIds[6] = "missing-sunday";
  const report = validateVocabularyData(
    invalid,
    referenceData,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((error) => error.includes("無法解析")),
  );
});

test("rejects a duplicate item inside one group", () => {
  const invalid = structuredClone(groupData);
  invalid.groups[0].items[6].lexemeId = "monday";
  const report = validateVocabularyData(
    invalid,
    referenceData,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((error) => error.includes("重複詞彙")),
  );
});

test("rejects a trigger lexeme that is not an item", () => {
  const invalid = structuredClone(groupData);
  invalid.groups[0].triggerLexemeIds.push("not-an-item");
  const report = validateVocabularyData(
    invalid,
    referenceData,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("不存在於 items"),
    ),
  );
});

test("rejects an invalid month sequence", () => {
  const invalid = structuredClone(groupData);
  const monthItems = invalid.groups.find(
    (group) => group.id === "months-of-year",
  ).items;
  [monthItems[0], monthItems[1]] = [
    monthItems[1],
    monthItems[0],
  ];
  monthItems.forEach((item, index) => {
    item.order = index + 1;
  });
  const report = validateVocabularyData(
    invalid,
    referenceData,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("January 到 December"),
    ),
  );
});

test("rejects missing Traditional Chinese reference text", () => {
  const invalid = structuredClone(referenceData);
  invalid.vocabulary.find(
    (item) => item.lexemeId === "tuesday",
  ).translationZhTw = "";
  const report = validateVocabularyData(
    groupData,
    invalid,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("英文或中文不可空白"),
    ),
  );
});

test("finds an English word with normalized case and whitespace", () => {
  const saturday = days.items.find(
    (item) => item.lexemeId === "saturday",
  );
  assert.equal(
    vocabularyItemMatchesSearch(
      days,
      saturday,
      "  SaTurDay  ",
    ),
    true,
  );
});

test("finds a Traditional Chinese translation", () => {
  const saturday = days.items.find(
    (item) => item.lexemeId === "saturday",
  );
  assert.equal(
    vocabularyItemMatchesSearch(days, saturday, "星期六"),
    true,
  );
});

test("derives learned and review-due states from existing progress", () => {
  const progress = createEmptyLevelProgress();
  progress.lexemeProgress.monday = {
    attempts: 1,
    correctAnswers: 1,
    completedLessonIds: ["a1-u6-l2"],
    lastLessonId: "a1-u6-l2",
    lastSeenAt: "2026-07-01T00:00:00.000Z",
  };
  const night = times.items.find(
    (item) => item.lexemeId === "night",
  );
  progress.reviewItems[night.occurrenceIds[0]] = {
    tokenId: night.occurrenceIds[0],
    answer: "night",
    prompt: "晚上",
    familiarity: "不熟",
    dueAt: "2026-07-01T00:00:00.000Z",
    intervalDays: 1,
    successfulDays: 0,
  };
  const monday = days.items.find(
    (item) => item.lexemeId === "monday",
  );
  assert.equal(
    vocabularyLearningState(
      monday,
      progress,
      undefined,
      new Date("2026-07-27T00:00:00.000Z"),
    ).status,
    "learned",
  );
  const nightState = vocabularyLearningState(
    night,
    progress,
    undefined,
    new Date("2026-07-27T00:00:00.000Z"),
  );
  assert.equal(nightState.status, "review-due");
  assert.equal(
    vocabularyStatusMatchesFilter(nightState, "review-due"),
    true,
  );
});

test("viewing and filtering vocabulary never mutates learning progress", () => {
  const progress = createEmptyLevelProgress();
  const before = JSON.stringify(progress);
  for (const group of dataset.groups) {
    for (const item of group.items) {
      vocabularyLearningState(item, progress);
      vocabularyItemMatchesSearch(group, item, "星期");
    }
  }
  assert.equal(JSON.stringify(progress), before);
});

test("shows a course shortcut only for a correct related word detail", () => {
  assert.equal(
    canShowVocabularyShortcut(
      dataset,
      "monday",
      "detail",
      true,
    ),
    true,
  );
  assert.equal(
    canShowVocabularyShortcut(
      dataset,
      "monday",
      "recall",
      false,
    ),
    false,
  );
});

test("does not show a shortcut for a non-related lexeme", () => {
  assert.equal(
    canShowVocabularyShortcut(
      dataset,
      "apple",
      "detail",
      true,
    ),
    false,
  );
});

test("preserves the lesson, detail stage, and token index for return", () => {
  assert.deepEqual(
    createVocabularyCourseReturnContext("a1-u6-l2", 2),
    {
      lessonId: "a1-u6-l2",
      stage: "detail",
      tokenIndex: 2,
    },
  );
});

test("isolates a related-vocabulary loading failure from A1 course construction", async () => {
  const failingFetcher = async () =>
    new Response("", { status: 500 });
  await assert.rejects(
    loadVocabularyDataset(a1Rows, failingFetcher),
    /相關字詞資料暫時無法載入/,
  );
  const units = buildCourseUnitsFromRows(a1Rows);
  assert.equal(units.length, 8);
  assert.equal(
    units.flatMap((unit) => unit.lessons).length,
    32,
  );
});

test("rejects progress fields and production-ready reference content", () => {
  const invalidGroups = structuredClone(groupData);
  invalidGroups.groups[0].progress = {};
  const invalidReference = structuredClone(referenceData);
  invalidReference.vocabulary[0].qaStatus = "production_ready";
  const report = validateVocabularyData(
    invalidGroups,
    invalidReference,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("不可保存學習進度"),
    ),
  );
  assert.ok(
    report.errors.some((error) =>
      error.includes("不可標成正式課程內容"),
    ),
  );
});

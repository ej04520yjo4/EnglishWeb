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
  resolveCanonicalVocabularyDisplay,
  resolveVocabularyGroupSelection,
  validateVocabularyData,
  vocabularyGroupForLexeme,
  vocabularyItemMatchesSearch,
  vocabularyLearningState,
  vocabularyStatusMatchesFilter,
  withVocabularySearchAliases,
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
  const brother = family.items.find(
    (item) => item.lexemeId === "brother",
  );
  assert.equal(brother.displayEnglish, "brother");
  assert.equal(
    brother.translationZhTw,
    "哥哥／弟弟／兄弟",
  );
  assert.equal(brother.chunks[0].text, "my brother");
  const brotherCourseRow = a1Rows.find(
    (row) => row.lexeme_id === "brother",
  );
  assert.equal(brotherCourseRow.answer, "brothers");
  assert.ok(
    brother.occurrenceIds.includes(
      brotherCourseRow.occurrence_id,
    ),
  );
  assert.equal(
    brother.audioStatus,
    brotherCourseRow.audio_status,
  );
  assert.equal(
    brother.audioSource,
    brotherCourseRow.word_audio_source ||
      brotherCourseRow.audio_source,
  );
});

test("resolves canonical vocabulary from lemma and a reusable Chinese override", () => {
  assert.deepEqual(
    resolveCanonicalVocabularyDisplay(
      {
        lexemeId: "example",
        canonicalTranslationZhTw: "分類代表中文",
      },
      {
        lemma: "example",
        answer: "examples",
        prompt: "語境中的複數翻譯",
      },
      undefined,
    ),
    {
      lemma: "example",
      displayEnglish: "example",
      translationZhTw: "分類代表中文",
    },
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

test("rejects a blank canonical Traditional Chinese override", () => {
  const invalid = structuredClone(groupData);
  invalid.groups
    .find((group) => group.id === "family-members")
    .items.find(
      (item) => item.lexemeId === "brother",
    ).canonicalTranslationZhTw = " ";
  const report = validateVocabularyData(
    invalid,
    referenceData,
    a1Rows,
  );
  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((error) =>
      error.includes("canonicalTranslationZhTw 不可空白"),
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

test("searches occurrence, lemma, prompt, chunk, and configured aliases", () => {
  const brother = family.items.find((item) => item.lexemeId === "brother");
  assert.equal(vocabularyItemMatchesSearch(family, brother, "brothers"), true);
  assert.equal(vocabularyItemMatchesSearch(family, brother, "my brother"), true);
  assert.equal(vocabularyItemMatchesSearch(family, brother, "我的兄弟"), true);
  assert.equal(vocabularyItemMatchesSearch(family, brother, "我的哥哥"), true);
  assert.equal(brother.displayEnglish, "brother");
  assert.equal(brother.translationZhTw, "哥哥／弟弟／兄弟");

  const night = times.items.find((item) => item.lexemeId === "night");
  assert.equal(vocabularyItemMatchesSearch(times, night, "at night"), true);
  assert.equal(vocabularyItemMatchesSearch(times, night, "在晚上"), true);
});

test("normalizes and deduplicates a generic explicit search alias", () => {
  const syntheticGroups = structuredClone(groupData);
  const saturday = syntheticGroups.groups
    .find((group) => group.id === "days-of-week")
    .items.find((item) => item.lexemeId === "saturday");
  saturday.searchAliases = ["  Weekend   Day ", "weekend day", "WEEKEND DAY"];
  const syntheticDataset = buildVocabularyDataset(
    syntheticGroups,
    referenceData,
    a1Rows,
  );
  const resolvedSaturday = syntheticDataset.groups
    .find((group) => group.id === "days-of-week")
    .items.find((item) => item.lexemeId === "saturday");
  assert.equal(
    resolvedSaturday.searchAliases.filter((alias) => alias === "weekend day")
      .length,
    1,
  );
  assert.equal(
    vocabularyItemMatchesSearch(
      syntheticDataset.groups.find((group) => group.id === "days-of-week"),
      resolvedSaturday,
      " WEEKEND   DAY ",
    ),
    true,
  );
});

test("rejects missing or malformed explicit search aliases", () => {
  const blankAliasGroups = structuredClone(groupData);
  blankAliasGroups.groups[0].items[0].searchAliases = [" "];
  const blankReport = validateVocabularyData(
    blankAliasGroups,
    referenceData,
    a1Rows,
  );
  assert.equal(blankReport.valid, false);
  assert.ok(blankReport.errors.some((error) => error.includes("searchAliases")));

  const scalarAliasGroups = structuredClone(groupData);
  scalarAliasGroups.groups[0].items[0].searchAliases = "Saturday";
  const scalarReport = validateVocabularyData(
    scalarAliasGroups,
    referenceData,
    a1Rows,
  );
  assert.equal(scalarReport.valid, false);
  assert.ok(scalarReport.errors.some((error) => error.includes("searchAliases")));

  const invalidEntryGroups = structuredClone(groupData);
  invalidEntryGroups.groups[0].items[0].searchAliases = ["Saturday", 42, null];
  const invalidEntryReport = validateVocabularyData(
    invalidEntryGroups,
    referenceData,
    a1Rows,
  );
  assert.equal(invalidEntryReport.valid, false);
  assert.ok(
    invalidEntryReport.errors.some((error) => error.includes("searchAliases")),
  );
});

test("adds matching later-course aliases without changing canonical or reference fields", () => {
  const before = structuredClone(dataset);
  const augmented = withVocabularySearchAliases(dataset, [
    {
      lexeme_id: "night",
      answer: "night",
      lemma: "night",
      prompt: "晚上",
      chunk_text: "last night",
      chunk_translation: "昨晚",
    },
    {
      lexeme_id: "january",
      answer: "January",
      lemma: "January",
      prompt: "一月",
      chunk_text: "the first month",
      chunk_translation: "第一個月",
    },
    {
      lexeme_id: "not-in-a-topic",
      answer: "should not leak",
      lemma: "should not leak",
      prompt: "不應出現",
      chunk_text: "unrelated chunk",
      chunk_translation: "不相關語塊",
    },
  ]);
  const augmentedTimes = augmented.groups.find(
    (group) => group.id === "times-of-day",
  );
  const augmentedNight = augmentedTimes.items.find(
    (item) => item.lexemeId === "night",
  );
  assert.equal(vocabularyItemMatchesSearch(augmentedTimes, augmentedNight, "last night"), true);
  assert.equal(vocabularyItemMatchesSearch(augmentedTimes, augmentedNight, "昨晚"), true);

  const augmentedMonths = augmented.groups.find(
    (group) => group.id === "months-of-year",
  );
  const january = augmentedMonths.items.find((item) => item.lexemeId === "january");
  const originalJanuary = months.items.find((item) => item.lexemeId === "january");
  assert.equal(january.source, "reference");
  assert.equal(january.displayEnglish, originalJanuary.displayEnglish);
  assert.equal(january.translationZhTw, originalJanuary.translationZhTw);
  assert.equal(january.audioStatus, originalJanuary.audioStatus);
  assert.deepEqual(january.occurrenceIds, originalJanuary.occurrenceIds);
  assert.equal(vocabularyItemMatchesSearch(augmentedMonths, january, "the first month"), true);

  const withoutSearchAliases = (item) => {
    const copy = { ...item };
    delete copy.searchAliases;
    return copy;
  };
  for (const augmentedGroup of augmented.groups) {
    const originalGroup = dataset.groups.find(
      (group) => group.id === augmentedGroup.id,
    );
    for (const augmentedItem of augmentedGroup.items) {
      const originalItem = originalGroup.items.find(
        (item) => item.lexemeId === augmentedItem.lexemeId,
      );
      assert.deepEqual(
        withoutSearchAliases(augmentedItem),
        withoutSearchAliases(originalItem),
        `${augmentedGroup.id}:${augmentedItem.lexemeId}`,
      );
    }
  }

  const selected = resolveVocabularyGroupSelection(
    augmented.groups,
    "days-of-week",
    (group, item) => vocabularyItemMatchesSearch(group, item, "last night"),
  );
  assert.equal(selected.activeGroup?.id, "times-of-day");
  assert.deepEqual(dataset, before);
  assert.equal(
    vocabularyItemMatchesSearch(
      augmented.groups.find((group) => group.id === "family-members"),
      augmented.groups.find((group) => group.id === "family-members").items[0],
      "last night",
    ),
    false,
  );
});

test("selects the first matching topic and preserves it when search clears", () => {
  const selection = (query, activeGroupId) =>
    resolveVocabularyGroupSelection(
      dataset.groups,
      activeGroupId,
      (group, item) =>
        vocabularyItemMatchesSearch(group, item, query),
    );

  const decemberEnglish = selection(
    "December",
    "days-of-week",
  );
  assert.deepEqual(
    decemberEnglish.visibleGroups.map((group) => group.id),
    ["months-of-year"],
  );
  assert.equal(
    decemberEnglish.activeGroup?.id,
    "months-of-year",
  );

  const decemberChinese = selection(
    "十二月",
    "days-of-week",
  );
  assert.equal(
    decemberChinese.activeGroup?.items.find(
      (item) =>
        vocabularyItemMatchesSearch(
          decemberChinese.activeGroup,
          item,
          "十二月",
        ),
    )?.displayEnglish,
    "December",
  );

  const husband = selection("先生", "days-of-week");
  assert.equal(husband.activeGroup?.id, "family-members");
  assert.equal(
    husband.activeGroup?.items.find((item) =>
      vocabularyItemMatchesSearch(
        husband.activeGroup,
        item,
        "先生",
      ),
    )?.displayEnglish,
    "husband",
  );

  const missing = selection(
    "not-a-real-vocabulary-item",
    "days-of-week",
  );
  assert.deepEqual(missing.visibleGroups, []);
  assert.equal(missing.activeGroup, null);

  const cleared = selection("", "months-of-year");
  assert.equal(cleared.visibleGroups.length, 4);
  assert.equal(cleared.activeGroup?.id, "months-of-year");
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

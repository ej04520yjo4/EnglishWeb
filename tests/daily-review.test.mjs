import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailyRecognitionOptions,
  buildDailyReviewQueue,
  DAILY_REVIEW_LIMIT,
  resolveDailyReviewSource,
} from "../app/daily-review.ts";
import { createEmptyVocabularyEvidence } from "../app/vocabulary-progress.ts";

const targetEntry = (lexemeId, sourceLexemeIds = [lexemeId]) => ({
  lexemeId,
  lemma: lexemeId,
  sourceLexemeIds,
  targetLevel: "A1",
  masteryTarget: "active",
  curriculumPriority: 1,
  topics: ["test"],
  sourceRefs: [],
  qaStatus: "pilot_review_required",
});

const targets = {
  schemaVersion: 1,
  status: "partial_review_required",
  completionLevel: "A2",
  goals: {
    totalLexemes: 3000,
    activeLexemes: 1500,
    receptiveLexemes: 1500,
    a1Cumulative: {
      totalLexemes: 1200,
      activeLexemes: 700,
      receptiveLexemes: 500,
    },
    a2Cumulative: {
      totalLexemes: 3000,
      activeLexemes: 1500,
      receptiveLexemes: 1500,
    },
  },
  entries: [
    targetEntry("apple"),
    targetEntry("book"),
    targetEntry("water"),
    targetEntry("name"),
    targetEntry("friend"),
    targetEntry("brother", ["brother", "brothers"]),
  ],
};

const source = (
  occurrenceId,
  lexemeId,
  prompt,
  overrides = {},
) => ({
  occurrenceId,
  lexemeId,
  level: "A1",
  answer: lexemeId,
  prompt,
  lessonId: `lesson-${occurrenceId}`,
  sentenceId: `sentence-${occurrenceId}`,
  sentence: `This is ${lexemeId}.`,
  translation: `這是${prompt}。`,
  ...overrides,
});

const sources = [
  source("occ-apple", "apple", "蘋果"),
  source("occ-book", "book", "書"),
  source("occ-water", "water", "水"),
  source("occ-name", "name", "名字"),
  source("occ-friend", "friend", "朋友"),
  source("occ-brothers", "brothers", "兄弟", { answer: "brothers" }),
];

const due = (tokenId, day = 1) => ({
  tokenId,
  answer: tokenId,
  prompt: tokenId,
  familiarity: "不熟",
  dueAt: `2026-08-${String(day).padStart(2, "0")}T00:00:00.000Z`,
  intervalDays: 1,
  successfulDays: 0,
});

test("daily review queue is stable, due-ordered, canonical, and capped at five", () => {
  const dueReviews = [
    due("occ-brothers", 6),
    due("occ-friend", 5),
    due("occ-name", 4),
    due("occ-water", 3),
    due("occ-book", 2),
    due("occ-apple", 1),
  ];
  const first = buildDailyReviewQueue({
    dueReviews,
    vocabularyProgress: {},
    vocabularyTargets: targets,
    sources,
  });
  const second = buildDailyReviewQueue({
    dueReviews,
    vocabularyProgress: {},
    vocabularyTargets: targets,
    sources,
  });

  assert.equal(DAILY_REVIEW_LIMIT, 5);
  assert.equal(first.length, 5);
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.map((item) => item.occurrenceId),
    ["occ-apple", "occ-book", "occ-water", "occ-name", "occ-friend"],
  );
  assert.deepEqual(
    first.map((item) => item.mode),
    ["spelling", "recognition", "application", "spelling", "recognition"],
  );
  first.forEach((item) => {
    assert.deepEqual(Object.keys(item).sort(), [
      "id",
      "level",
      "lexemeId",
      "mode",
      "occurrenceId",
    ]);
    assert.equal(item.id, `daily-review:${item.occurrenceId}:${item.mode}`);
  });
});

test("daily review mode follows the strongest recorded evidence weakness", () => {
  const spelling = createEmptyVocabularyEvidence();
  spelling.spellingAttemptEvidenceIds = ["s1", "s2", "s3"];
  spelling.spellingCorrectEvidenceIds = ["s1"];
  spelling.recognitionAttemptEvidenceIds = ["r1"];

  const recognition = createEmptyVocabularyEvidence();
  recognition.recognitionAttemptEvidenceIds = ["r1", "r2"];

  const application = createEmptyVocabularyEvidence();
  application.applicationAttemptEvidenceIds = ["a1", "a2", "a3"];
  application.applicationCorrectEvidenceIds = ["a1"];

  const queue = buildDailyReviewQueue({
    dueReviews: [due("occ-apple"), due("occ-book"), due("occ-water")],
    vocabularyProgress: { apple: spelling, book: recognition, water: application },
    vocabularyTargets: targets,
    sources,
  });
  assert.deepEqual(
    queue.map((item) => item.mode),
    ["spelling", "recognition", "application"],
  );
});

test("application weakness falls back when no formal sentence is available", () => {
  const evidence = createEmptyVocabularyEvidence();
  evidence.applicationAttemptEvidenceIds = ["a1", "a2"];
  const noApplicationSource = source("occ-apple", "apple", "蘋果", {
    sentenceId: "",
    sentence: "",
    translation: "",
  });
  const queue = buildDailyReviewQueue({
    dueReviews: [due("occ-apple")],
    vocabularyProgress: { apple: evidence },
    vocabularyTargets: targets,
    sources: [noApplicationSource],
  });
  assert.equal(queue[0].mode, "spelling");
});

test("formal due reviews remain active while vocabulary targets are unavailable", () => {
  const queue = buildDailyReviewQueue({
    dueReviews: [due("occ-apple")],
    vocabularyProgress: {},
    vocabularyTargets: null,
    sources,
  });

  assert.equal(queue.length, 1);
  assert.equal(queue[0].occurrenceId, "occ-apple");
  assert.equal(queue[0].lexemeId, "apple");
});

test("queue ignores unsafe missing sources, non-target lexemes, and duplicate lexemes", () => {
  const queue = buildDailyReviewQueue({
    dueReviews: [
      due("missing"),
      due("occ-unknown"),
      due("occ-brothers"),
      due("occ-brother-second"),
    ],
    vocabularyProgress: {},
    vocabularyTargets: targets,
    sources: [
      ...sources,
      source("occ-unknown", "unknown", "未知"),
      source("occ-brother-second", "brother", "兄弟"),
    ],
  });
  assert.equal(queue.length, 1);
  assert.equal(queue[0].occurrenceId, "occ-brother-second");
  assert.equal(queue[0].lexemeId, "brother");
});

test("recognition options are deterministic, unique, and include the answer", () => {
  const apple = sources[0];
  const first = buildDailyRecognitionOptions(apple, sources);
  const second = buildDailyRecognitionOptions(apple, [...sources].reverse());

  assert.deepEqual(first, second);
  assert.equal(first.length, 4);
  assert.equal(new Set(first).size, first.length);
  assert.ok(first.includes("蘋果"));
});

test("queue source resolution requires the exact formal occurrence", () => {
  const [item] = buildDailyReviewQueue({
    dueReviews: [due("occ-apple")],
    vocabularyProgress: {},
    vocabularyTargets: targets,
    sources,
  });
  assert.equal(resolveDailyReviewSource(item, sources)?.sentenceId, "sentence-occ-apple");
  assert.equal(
    resolveDailyReviewSource({ ...item, occurrenceId: "missing" }, sources),
    null,
  );

  const [aliasedItem] = buildDailyReviewQueue({
    dueReviews: [due("occ-brothers")],
    vocabularyProgress: {},
    vocabularyTargets: targets,
    sources,
  });
  assert.equal(aliasedItem.lexemeId, "brother");
  assert.equal(
    resolveDailyReviewSource(aliasedItem, sources)?.answer,
    "brothers",
  );
});

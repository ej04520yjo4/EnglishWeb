import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildCourseUnitsFromRows,
  checksumA1CourseSource,
  createStoredA1CourseData,
  EXPECTED_A1_LESSON_COUNT,
  EXPECTED_A1_ROW_COUNT,
  EXPECTED_A1_UNIT_COUNT,
  flattenCourseLessons,
  OFFICIAL_A1_MVP_CSV_URL,
  OFFICIAL_A1_SOURCE_VERSION,
  parseA1MvpCsv,
  restoreStoredA1CourseData,
  serializeA1MvpCsv,
  validateA1CourseRows,
} from "../app/a1-mvp-data.ts";
import { wordAccuracy } from "../app/assessment-scoring.ts";
import {
  emptyTokenLearningProgress,
  recordLearningEntityAttempt,
  recordLearningEntityCompletion,
  restoreLearningProgress,
  reviewIntervalForToken,
  scheduleTokenReview,
  serializeLearningProgress,
  updateTokenLearningProgress,
} from "../app/learning-progress.ts";
import {
  evaluatePassageRebuild,
  lessonsForPassage,
} from "../app/passage-flow.ts";
import { evaluateRebuildAttempt } from "../app/rebuild-flow.ts";
import { kkPhoneticGroups } from "../app/kk-phonetics.ts";

const csvUrl = new URL("../public/data/a1-course-v3.csv", import.meta.url);
const oldCsvUrl = new URL(
  "../public/data/A1課程內容_QA_corrected_v3.csv",
  import.meta.url,
);

async function loadRows() {
  return parseA1MvpCsv(await readFile(csvUrl, "utf8"));
}

test("reads the official v3 curriculum from the ASCII CSV path", async () => {
  await access(csvUrl);
  await assert.rejects(access(oldCsvUrl));
  assert.equal(OFFICIAL_A1_MVP_CSV_URL, "/data/a1-course-v3.csv");
  assert.equal(OFFICIAL_A1_SOURCE_VERSION, "a1-course-v3.csv");
});

test("builds all 8 units, 32 lessons, and 145 word tokens from v3 CSV", async () => {
  const rows = await loadRows();
  const report = validateA1CourseRows(rows);
  const units = buildCourseUnitsFromRows(rows);
  const lessons = flattenCourseLessons(units);

  assert.equal(rows.length, EXPECTED_A1_ROW_COUNT);
  assert.equal(units.length, EXPECTED_A1_UNIT_COUNT);
  assert.equal(lessons.length, EXPECTED_A1_LESSON_COUNT);
  assert.equal(
    lessons.flatMap((lesson) => lesson.tokens).length,
    EXPECTED_A1_ROW_COUNT,
  );
  assert.equal(report.valid, true, report.validationErrors.join("\n"));
  assert.ok(
    lessons.every(
      (lesson) => lesson.sourceVersion === OFFICIAL_A1_SOURCE_VERSION,
    ),
  );
});

test("keeps every answer at one word while retaining chunk, lexeme, sense, and pattern data", async () => {
  const rows = await loadRows();
  const lessons = flattenCourseLessons(buildCourseUnitsFromRows(rows));
  const tokens = lessons.flatMap((lesson) => lesson.tokens);

  assert.ok(tokens.every((token) => /^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(token.answer)));
  assert.ok(tokens.every((token) => token.occurrenceId));
  assert.ok(tokens.every((token) => token.tokenId));
  assert.ok(tokens.every((token) => token.lexemeId && token.senseId));
  assert.ok(lessons.every((lesson) => lesson.sentencePatternId));

  const getUp = tokens.filter((token) => token.chunk?.id === "get-up");
  assert.deepEqual(getUp.map((token) => token.answer), ["get", "up", "get", "up"]);
  assert.ok(getUp.every((token) => token.chunk.text === "get up"));
  assert.ok(getUp.every((token) => token.chunk.translation === "起床"));
});

test("uses the four v3 sentences for the unit 8 passage", async () => {
  const lessons = flattenCourseLessons(
    buildCourseUnitsFromRows(await loadRows()),
  );
  const passage = lessonsForPassage(lessons, "a1-u8-p01");

  assert.deepEqual(
    passage.map((lesson) => lesson.sentence),
    [
      "I get up at seven.",
      "I eat breakfast at home.",
      "I go to work at eight.",
      "I go to work by bus.",
    ],
  );
  assert.deepEqual(
    passage.map((lesson) => lesson.sentenceOrder),
    [1, 2, 3, 4],
  );
  assert.ok(passage.every((lesson) => lesson.passageId === "a1-u8-p01"));
  assert.ok(
    passage.every(
      (lesson) => !lesson.sentence.toLowerCase().includes("would like to"),
    ),
  );
});

test("exports and reimports all v3 fields without data loss", async () => {
  const rows = await loadRows();
  const exported = serializeA1MvpCsv(rows);
  const restored = parseA1MvpCsv(exported);
  const report = validateA1CourseRows(
    restored,
    rows.map((row) => row.occurrence_id),
  );

  assert.deepEqual(restored, rows);
  assert.equal(report.valid, true, report.validationErrors.join("\n"));
  for (const field of [
    "occurrence_id",
    "token_id",
    "lexeme_id",
    "sense_id",
    "context_pos",
    "prompt_type",
    "chunk_id",
    "chunk_text",
    "chunk_translation",
    "sentence_pattern_id",
    "passage_id",
    "sentence_id",
    "sentence_order",
  ]) {
    assert.ok(Object.hasOwn(restored[0], field), `missing ${field}`);
  }
});

test("stores course data with its official revision and rejects a stale local copy", async () => {
  const csvText = await readFile(csvUrl, "utf8");
  const rows = parseA1MvpCsv(csvText);
  const revision = await checksumA1CourseSource(csvText);
  const snapshot = createStoredA1CourseData(
    rows,
    revision,
    "2026-07-25T00:00:00.000Z",
  );

  assert.equal(snapshot.sourceVersion, OFFICIAL_A1_SOURCE_VERSION);
  assert.equal(snapshot.sourceRevision, revision);
  assert.equal(snapshot.updatedAt, "2026-07-25T00:00:00.000Z");
  assert.deepEqual(
    restoreStoredA1CourseData(JSON.stringify(snapshot), rows, revision)?.rows,
    rows,
  );
  assert.equal(
    restoreStoredA1CourseData(
      JSON.stringify(snapshot),
      rows,
      `${revision}-new`,
    ),
    null,
  );
});

test("rejects an answer-only content draft before it can replace course rows", async () => {
  const rows = await loadRows();
  const draft = rows.map((row) =>
    row.occurrence_id === "a1-u1-l1-t03"
      ? { ...row, answer: "Grace" }
      : row,
  );
  const report = validateA1CourseRows(
    draft,
    rows.map((row) => row.occurrence_id),
    rows,
  );

  assert.equal(report.valid, false);
  assert.ok(
    report.validationErrors.some((message) =>
      message.includes("answer 已改變"),
    ),
  );
});

test("applies the same recall, detail, rebuild, and dictation flow to every lesson", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const lessons = flattenCourseLessons(
    buildCourseUnitsFromRows(await loadRows()),
  );

  assert.equal(new Set(lessons.map((lesson) => lesson.sourceVersion)).size, 1);
  assert.match(page, /"recall"/);
  assert.match(page, /"detail"/);
  assert.match(page, /"rebuild"/);
  assert.match(page, /"dictation"/);
  assert.doesNotMatch(page, /selectedLesson\.sourceVersion\s*===/);
});

test("completes the unit 8 passage rebuild and reports sentence errors", async () => {
  const lessons = flattenCourseLessons(
    buildCourseUnitsFromRows(await loadRows()),
  );
  const passage = lessonsForPassage(lessons, "a1-u8-p01");
  const correct = evaluatePassageRebuild(
    passage.map((lesson) => lesson.sentence),
    passage,
  );
  const incorrect = evaluatePassageRebuild(
    [
      "I get up at seven.",
      "I eat breakfast at home.",
      "I go work at eight.",
      "I go to work by bus.",
    ],
    passage,
  );

  assert.ok(correct.every((result) => result.correct));
  assert.equal(incorrect[2].correct, false);
  assert.match(incorrect[2].message, /第 3 個位置需要再檢查/);
});

test("stores independent token performance and schedules review per token", () => {
  let tokenProgress = {};
  tokenProgress = updateTokenLearningProgress(
    tokenProgress,
    "a1-u1-l1-t01",
    {
      attemptDelta: 1,
      elapsedDelta: 8,
      correctDelta: 1,
    },
    "2026-07-25T00:00:00.000Z",
  );
  tokenProgress = updateTokenLearningProgress(
    tokenProgress,
    "a1-u1-l1-t02",
    {
      attemptDelta: 3,
      hintDelta: 2,
      elapsedDelta: 30,
      audioReplayDelta: 3,
      answerRevealed: true,
      usedPaste: true,
    },
    "2026-07-25T00:01:00.000Z",
  );

  assert.deepEqual(
    Object.keys(tokenProgress),
    ["a1-u1-l1-t01", "a1-u1-l1-t02"],
  );
  assert.equal(reviewIntervalForToken(tokenProgress["a1-u1-l1-t01"]), 3);
  assert.equal(reviewIntervalForToken(tokenProgress["a1-u1-l1-t02"]), 1);
  assert.deepEqual(
    { ...emptyTokenLearningProgress(), ...tokenProgress["a1-u1-l1-t02"] },
    tokenProgress["a1-u1-l1-t02"],
  );
});

test("keeps accumulated successful review days when a lesson is completed again", () => {
  const existing = {
    tokenId: "a1-u1-l1-t01",
    answer: "I",
    prompt: "我",
    familiarity: "熟悉",
    dueAt: "2026-07-25T00:00:00.000Z",
    intervalDays: 6,
    successfulDays: 1,
  };
  const scheduled = scheduleTokenReview(
    existing,
    {
      tokenId: existing.tokenId,
      answer: existing.answer,
      prompt: existing.prompt,
    },
    3,
    new Date("2026-07-25T00:00:00.000Z"),
  );

  assert.equal(scheduled.successfulDays, 1);
  assert.equal(scheduled.familiarity, "熟悉");
  assert.ok(scheduled.intervalDays >= existing.intervalDays);
  assert.ok(new Date(scheduled.dueAt) > new Date(existing.dueAt));
});

test("restores local progress after a simulated browser refresh", () => {
  const beforeRefresh = {
    schemaVersion: 3,
    completedLessonIds: ["a1-u1-l1"],
    tokenProgress: {
      "a1-u1-l1-t01": {
        ...emptyTokenLearningProgress(),
        attempts: 1,
        correctAnswers: 1,
      },
    },
  };
  const storageValue = serializeLearningProgress(beforeRefresh);
  const afterRefresh = restoreLearningProgress(storageValue);

  assert.deepEqual(afterRefresh, beforeRefresh);
});

test("penalizes extra assessment words", () => {
  assert.equal(wordAccuracy("I have an apple.", "I have an apple."), 100);
  assert.equal(
    wordAccuracy("I have an apple today", "I have an apple."),
    80,
  );
});

test("records lexeme, sense, sentence-pattern, and completion progress", async () => {
  const lesson = flattenCourseLessons(
    buildCourseUnitsFromRows(await loadRows()),
  )[0];
  let lexemeProgress = {};
  let senseProgress = {};

  for (const token of lesson.tokens) {
    lexemeProgress = recordLearningEntityAttempt(
      lexemeProgress,
      token.lexemeId,
      lesson.id,
      true,
      "2026-07-24T00:00:00.000Z",
    );
    senseProgress = recordLearningEntityAttempt(
      senseProgress,
      token.senseId,
      lesson.id,
      true,
      "2026-07-24T00:00:00.000Z",
    );
    lexemeProgress = recordLearningEntityCompletion(
      lexemeProgress,
      token.lexemeId,
      lesson.id,
      "2026-07-24T00:01:00.000Z",
    );
    senseProgress = recordLearningEntityCompletion(
      senseProgress,
      token.senseId,
      lesson.id,
      "2026-07-24T00:01:00.000Z",
    );
  }

  assert.deepEqual(Object.keys(lexemeProgress), ["i", "be", "amy"]);
  assert.deepEqual(
    lexemeProgress.be.completedLessonIds,
    ["a1-u1-l1"],
  );
  assert.equal(senseProgress["be-identification"].correctAnswers, 1);
});

test("reveals the correct sentence after three rebuild errors", () => {
  const expected = ["That", "is", "my", "bag"];
  const first = evaluateRebuildAttempt(["this", "is", "my", "bag"], expected, 0);
  const second = evaluateRebuildAttempt(
    ["this", "is", "my", "bag"],
    expected,
    first.attempts,
  );
  const third = evaluateRebuildAttempt(
    ["this", "is", "my", "bag"],
    expected,
    second.attempts,
  );

  assert.equal(third.attempts, 3);
  assert.equal(third.revealed, true);
  assert.deepEqual(third.displayValues, expected);
});

test("provides a separate complete 41-symbol KK phonetic practice set", () => {
  const vowels = kkPhoneticGroups.find((group) => group.id === "vowels");
  const consonants = kkPhoneticGroups.find((group) => group.id === "consonants");
  const entries = kkPhoneticGroups.flatMap((group) => group.entries);

  assert.equal(vowels.entries.length, 17);
  assert.equal(consonants.entries.length, 24);
  assert.equal(entries.length, 41);
  assert.equal(new Set(entries.map((entry) => entry.audioId)).size, 41);
  assert.ok(
    entries.every((entry) =>
      /^https:\/\/upload\.wikimedia\.org\//.test(entry.audioSrc),
    ),
  );
});

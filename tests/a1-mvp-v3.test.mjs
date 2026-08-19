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
import {
  recallIncorrectFeedback,
  resolveCrossInputNavigation,
} from "../app/input-flow.ts";
import { kkPhoneticGroups } from "../app/kk-phonetics.ts";
import {
  isPatternTransferCorrect,
  patternCoverageSummary,
  validatePatternExerciseData,
  validateReadingExerciseData,
} from "../app/a1-exercises.ts";
import {
  nextHintLevel,
  reviewExercisesForError,
} from "../app/learning-adaptation.ts";

const csvUrl = new URL("../public/data/a1-course-v3.csv", import.meta.url);
const patternsUrl = new URL(
  "../public/data/a1-pattern-exercises.json",
  import.meta.url,
);
const readingUrl = new URL(
  "../public/data/a1-reading-exercises.json",
  import.meta.url,
);
const oldCsvUrl = new URL(
  "../public/data/A1課程內容_QA_corrected_v3.csv",
  import.meta.url,
);

async function loadRows() {
  return parseA1MvpCsv(await readFile(csvUrl, "utf8"));
}

async function loadExerciseData() {
  const [patterns, reading] = await Promise.all([
    readFile(patternsUrl, "utf8").then(JSON.parse),
    readFile(readingUrl, "utf8").then(JSON.parse),
  ]);
  return { patterns, reading };
}

test("reads the official v3 curriculum from the ASCII CSV path", async () => {
  await access(csvUrl);
  await assert.rejects(access(oldCsvUrl));
  assert.equal(OFFICIAL_A1_MVP_CSV_URL, "/data/a1-course-v3.csv");
  assert.equal(OFFICIAL_A1_SOURCE_VERSION, "a1-course-v3.csv");
});

test("reveals a near-miss answer on the third attempt and requires retyping", () => {
  assert.deepEqual(recallIncorrectFeedback("becaus", "because", 1), {
    message: "拼字很接近，再檢查一次。",
    revealAnswer: false,
    replayAudio: false,
  });
  assert.deepEqual(recallIncorrectFeedback("becaus", "because", 3), {
    message: "正確答案是 because。請重新輸入一次。",
    revealAnswer: true,
    replayAudio: false,
  });
});

test("moves between recall or rebuild inputs only at field boundaries", () => {
  const base = {
    valueLength: 3,
    selectionStart: 0,
    selectionEnd: 0,
    hasPrevious: true,
    hasNext: true,
  };
  assert.equal(
    resolveCrossInputNavigation({ ...base, key: "ArrowLeft" }),
    "previous-end",
  );
  assert.equal(
    resolveCrossInputNavigation({
      ...base,
      key: "ArrowRight",
      selectionStart: 3,
      selectionEnd: 3,
    }),
    "next-start",
  );
  assert.equal(
    resolveCrossInputNavigation({
      ...base,
      key: "Backspace",
      valueLength: 0,
    }),
    "previous-end",
  );
  assert.equal(
    resolveCrossInputNavigation({
      ...base,
      key: "ArrowLeft",
      selectionStart: 1,
      selectionEnd: 1,
    }),
    null,
  );
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

test("uses the same text-first base flow and removes dictation from every lesson", async () => {
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
  assert.doesNotMatch(page, /"dictation"/);
  assert.match(page, /"reading-recognition"/);
  assert.match(page, /"pattern-transfer"/);
  assert.match(page, /"text-response"/);
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

test("pattern variations only use lexemes learned by that lesson", async () => {
  const rows = await loadRows();
  const { patterns } = await loadExerciseData();
  const report = validatePatternExerciseData(patterns, rows);

  assert.equal(report.valid, true, report.errors.join("\n"));
});

test("pattern variations never repeat their source sentence", async () => {
  const rows = await loadRows();
  const { patterns } = await loadExerciseData();
  const sourceBySentenceId = new Map(
    rows.map((row) => [row.sentence_id, row.sentence.toLowerCase()]),
  );

  for (const example of patterns.patterns.flatMap(
    (pattern) => pattern.examples,
  )) {
    assert.notEqual(
      example.sentence.toLowerCase(),
      sourceBySentenceId.get(example.sourceSentenceId),
    );
  }
});

test("rejects a pattern variation that introduces an unlearned lexeme", async () => {
  const rows = await loadRows();
  const { patterns } = await loadExerciseData();
  const invalid = structuredClone(patterns);
  invalid.patterns
    .find((pattern) => pattern.id === "be-relationship")
    .examples[0].requiredLexemeIds.push("not-yet-learned");
  const report = validatePatternExerciseData(invalid, rows);

  assert.equal(report.valid, false);
  assert.ok(
    report.errors.some((message) =>
      message.includes("not-yet-learned"),
    ),
  );
});

test("rejects lesson and source IDs that do not exist in the official CSV", async () => {
  const rows = await loadRows();
  const { patterns, reading } = await loadExerciseData();

  const missingPracticeLesson = structuredClone(patterns);
  missingPracticeLesson.patterns
    .find((pattern) => pattern.id === "be-relationship")
    .examples[0].practiceLessonId = "a1-u99-l99";
  const practiceReport = validatePatternExerciseData(
    missingPracticeLesson,
    rows,
  );
  assert.equal(practiceReport.valid, false);
  assert.ok(
    practiceReport.errors.some((message) =>
      message.includes("a1-u99-l99"),
    ),
  );

  const malformedPracticeLesson = structuredClone(patterns);
  malformedPracticeLesson.patterns
    .find((pattern) => pattern.id === "be-relationship")
    .examples[0].practiceLessonId = "not-a-lesson";
  const malformedReport = validatePatternExerciseData(
    malformedPracticeLesson,
    rows,
  );
  assert.equal(malformedReport.valid, false);
  assert.ok(
    malformedReport.errors.some((message) =>
      message.includes("not-a-lesson"),
    ),
  );

  const missingPatternSource = structuredClone(patterns);
  missingPatternSource.patterns
    .find((pattern) => pattern.id === "be-relationship")
    .examples[0].sourceSentenceId = "a1-u99-p01-s01";
  const patternSourceReport = validatePatternExerciseData(
    missingPatternSource,
    rows,
  );
  assert.equal(patternSourceReport.valid, false);
  assert.ok(
    patternSourceReport.errors.some((message) =>
      message.includes("a1-u99-p01-s01"),
    ),
  );

  const missingRecognitionLesson = structuredClone(reading);
  missingRecognitionLesson.recognition[0].lessonId = "a1-u99-l99";
  const recognitionReport = validateReadingExerciseData(
    missingRecognitionLesson,
    rows,
    patterns,
  );
  assert.equal(recognitionReport.valid, false);
  assert.ok(
    recognitionReport.errors.some((message) =>
      message.includes("a1-u99-l99"),
    ),
  );

  const missingTextLesson = structuredClone(reading);
  missingTextLesson.textResponses[0].lessonId = "a1-u99-l99";
  const textLessonReport = validateReadingExerciseData(
    missingTextLesson,
    rows,
    patterns,
  );
  assert.equal(textLessonReport.valid, false);
  assert.ok(
    textLessonReport.errors.some((message) =>
      message.includes("a1-u99-l99"),
    ),
  );

  const missingTextSource = structuredClone(reading);
  missingTextSource.textResponses[0].sourceSentenceId =
    "a1-u99-p01-s01";
  const textSourceReport = validateReadingExerciseData(
    missingTextSource,
    rows,
    patterns,
  );
  assert.equal(textSourceReport.valid, false);
  assert.ok(
    textSourceReport.errors.some((message) =>
      message.includes("a1-u99-p01-s01"),
    ),
  );
});

test("rejects learned lexemes and chunks that are outside a pattern slot allowlist", async () => {
  const rows = await loadRows();
  const { patterns } = await loadExerciseData();

  const invalidLexeme = structuredClone(patterns);
  const relationshipExample = invalidLexeme.patterns
    .find((pattern) => pattern.id === "be-relationship")
    .examples[0];
  relationshipExample.sentence = "She is Amy.";
  relationshipExample.requiredLexemeIds = ["she", "be", "amy"];
  const lexemeReport = validatePatternExerciseData(
    invalidLexeme,
    rows,
  );
  assert.equal(lexemeReport.valid, false);
  assert.ok(
    lexemeReport.errors.some(
      (message) =>
        message.includes("slot allowedLexemeIds") &&
        message.includes("amy"),
    ),
  );

  const invalidChunk = structuredClone(patterns);
  invalidChunk.patterns
    .find((pattern) => pattern.id === "be-location")
    .examples[0].requiredChunkIds.push("at-home");
  const chunkReport = validatePatternExerciseData(
    invalidChunk,
    rows,
  );
  assert.equal(chunkReport.valid, false);
  assert.ok(
    chunkReport.errors.some(
      (message) =>
        message.includes("slot allowedChunkIds") &&
        message.includes("at-home"),
    ),
  );
});

test("checks pattern-transfer answers while allowing punctuation normalization", async () => {
  const { patterns } = await loadExerciseData();
  const example = patterns.patterns
    .find((pattern) => pattern.id === "have-possession")
    .examples.find((item) => item.id === "have-possession-book");

  assert.equal(isPatternTransferCorrect("I have a book.", example), true);
  assert.equal(isPatternTransferCorrect("i have a book", example), true);
  assert.equal(isPatternTransferCorrect("I have a pen.", example), false);
  assert.equal(
    isPatternTransferCorrect("I have a book today.", example),
    false,
  );
});

test("uses the actual transfer pattern name on the result page", async () => {
  const page = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    page,
    /句型：\$\{selectedTransferPatternName\}/,
  );
  assert.doesNotMatch(
    page,
    /句型：\$\{selectedLesson\.patternName\}/,
  );
});

test("keeps reading-recognition distractors unique and different from the answer", async () => {
  const rows = await loadRows();
  const { patterns, reading } = await loadExerciseData();
  const report = validateReadingExerciseData(reading, rows, patterns);

  assert.equal(report.valid, true, report.errors.join("\n"));
  for (const exercise of reading.recognition) {
    const texts = exercise.options.map((option) =>
      option.text.trim().toLowerCase(),
    );
    assert.equal(new Set(texts).size, texts.length);
    assert.equal(
      exercise.options.filter(
        (option) => option.id === exercise.correctOptionId,
      ).length,
      1,
    );
  }
});

test("covers every enabled CSV sentence pattern with a valid non-source variation", async (t) => {
  const rows = await loadRows();
  const { patterns } = await loadExerciseData();
  const report = validatePatternExerciseData(patterns, rows);
  const coverage = patternCoverageSummary(patterns, rows);
  const csvPatternIds = new Set(
    rows.map((row) => row.sentence_pattern_id),
  );

  assert.equal(report.valid, true, report.errors.join("\n"));
  assert.equal(patterns.patterns.length, csvPatternIds.size);
  assert.ok(
    patterns.patterns.every(
      (pattern) => typeof pattern.enabledForTransfer === "boolean",
    ),
  );
  assert.ok(
    patterns.patterns
      .filter((pattern) => pattern.enabledForTransfer)
      .every((pattern) => pattern.examples.length >= 1),
  );
  assert.equal(coverage.csvPatternCount, 20);
  assert.equal(coverage.enabledPatternCount, 4);
  assert.equal(coverage.exercisedPatternCount, 4);
  assert.equal(coverage.uncoveredPatternIds.length, 16);
  t.diagnostic(`CSV句型總數：${coverage.csvPatternCount}`);
  t.diagnostic(`已啟用句型數：${coverage.enabledPatternCount}`);
  t.diagnostic(`已有練習句型數：${coverage.exercisedPatternCount}`);
  t.diagnostic(`尚未覆蓋句型數：${coverage.uncoveredPatternIds.length}`);
});

test("unit 8 comprehension answers stay consistent with their source passage", async () => {
  const rows = await loadRows();
  const { patterns, reading } = await loadExerciseData();
  const report = validateReadingExerciseData(reading, rows, patterns);
  const passage = reading.passages.find(
    (item) => item.passageId === "a1-u8-p01",
  );

  assert.equal(report.valid, true, report.errors.join("\n"));
  assert.equal(passage.questions.length, 3);
  assert.deepEqual(
    passage.questions.map((question) => question.correctAnswer),
    ["At seven.", "At home.", "By bus."],
  );
});

test("adds a manually reviewed second batch with recognition, two transfers, and response practice", async () => {
  const rows = await loadRows();
  const { patterns, reading } = await loadExerciseData();
  const batch = [
    ["be-relationship", "a1-u3-l2"],
    ["action-at-time", "a1-u5-l4"],
    ["be-location", "a1-u7-l3"],
  ];

  for (const [patternId, lessonId] of batch) {
    const pattern = patterns.patterns.find(
      (item) => item.id === patternId,
    );
    assert.equal(pattern.enabledForTransfer, true);
    assert.ok(pattern.examples.length >= 2);
    assert.ok(
      pattern.examples.every(
        (example) => example.practiceLessonId === lessonId,
      ),
    );
    assert.ok(
      reading.recognition.some(
        (exercise) =>
          exercise.lessonId === lessonId &&
          exercise.sentencePatternId === patternId,
      ),
    );
    assert.ok(
      reading.textResponses.some(
        (exercise) =>
          exercise.lessonId === lessonId &&
          exercise.sentencePatternId === patternId,
      ),
    );
  }

  const patternReport = validatePatternExerciseData(patterns, rows);
  const readingReport = validateReadingExerciseData(
    reading,
    rows,
    patterns,
  );
  assert.equal(patternReport.valid, true, patternReport.errors.join("\n"));
  assert.equal(readingReport.valid, true, readingReport.errors.join("\n"));
});

test("keeps a1-u3-l2 transfer practice aligned with its be-relationship source", async () => {
  const { patterns, reading } = await loadExerciseData();
  const relationship = patterns.patterns.find(
    (pattern) => pattern.id === "be-relationship",
  );
  const identification = patterns.patterns.find(
    (pattern) => pattern.id === "be-identification",
  );
  const recognition = reading.recognition.find(
    (exercise) => exercise.lessonId === "a1-u3-l2",
  );
  const response = reading.textResponses.find(
    (exercise) => exercise.lessonId === "a1-u3-l2",
  );

  assert.equal(relationship.enabledForTransfer, true);
  assert.deepEqual(
    relationship.examples.map((example) => example.sentence),
    ["She is my friend.", "She is my wife."],
  );
  assert.ok(
    relationship.examples.every(
      (example) =>
        example.sourceSentenceId === "a1-u3-l2-p01-s01" &&
        example.sentencePatternId === "be-relationship",
    ),
  );
  assert.equal(identification.enabledForTransfer, false);
  assert.equal(
    identification.deferReason,
    "等待未來單元複習模式使用。",
  );
  assert.deepEqual(identification.examples, []);
  assert.equal(recognition.sentencePatternId, "be-relationship");
  assert.equal(recognition.stem, "He is my friend.");
  assert.equal(response.sentencePatternId, "be-relationship");
});

test("keeps Chinese prompts and English answers consistent in person and meaning", async () => {
  const rows = await loadRows();
  const { patterns, reading } = await loadExerciseData();
  const apple = reading.textResponses.find(
    (exercise) => exercise.id === "response-a1-u4-l1-have-possession",
  );
  const report = validateReadingExerciseData(reading, rows, patterns);

  assert.equal(
    apple.prompt,
    "請選出符合「我有一顆蘋果」的英文句子。",
  );
  assert.equal(
    apple.options.find((option) => option.id === apple.correctOptionId)
      .text,
    "I have an apple.",
  );
  assert.equal(report.valid, true, report.errors.join("\n"));
});

test("adjusts hint levels from individual performance", () => {
  const fastCorrect = {
    ...emptyTokenLearningProgress(),
    attempts: 1,
    correctAnswers: 1,
    elapsedSeconds: 8,
  };
  const slow = {
    ...emptyTokenLearningProgress(),
    attempts: 1,
    correctAnswers: 1,
    elapsedSeconds: 28,
  };
  const revealed = {
    ...emptyTokenLearningProgress(),
    attempts: 3,
    answerRevealed: true,
  };

  assert.equal(nextHintLevel(1, fastCorrect), 2);
  assert.equal(nextHintLevel(3, slow), 2);
  assert.equal(nextHintLevel(3, revealed), 1);
});

test("maps different errors to different review exercise types", () => {
  assert.deepEqual(reviewExercisesForError("spelling"), ["word-recall"]);
  assert.deepEqual(reviewExercisesForError("word-order"), [
    "sentence-rebuild",
  ]);
  assert.deepEqual(reviewExercisesForError("meaning"), [
    "reading-recognition",
  ]);
  assert.deepEqual(reviewExercisesForError("pattern-transfer"), [
    "pattern-transfer",
  ]);
  assert.deepEqual(reviewExercisesForError("passage-comprehension"), [
    "passage-comprehension",
  ]);
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

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  buildPilotLessonFromRows,
  parseA1MvpCsv,
  PILOT_LESSON_ID,
} from "../app/a1-mvp-data.ts";
import {
  recordLearningEntityAttempt,
  recordLearningEntityCompletion,
} from "../app/learning-progress.ts";
import { evaluateRebuildAttempt } from "../app/rebuild-flow.ts";
import { kkPhoneticGroups } from "../app/kk-phonetics.ts";

const csvUrl = new URL(
  "../public/data/A1課程內容_QA_corrected_v3.csv",
  import.meta.url,
);

async function loadRows() {
  return parseA1MvpCsv(await readFile(csvUrl, "utf8"));
}

test("loads the official v3 pilot lesson as three word-level answers", async () => {
  const rows = await loadRows();
  const lesson = buildPilotLessonFromRows(rows);

  assert.equal(lesson.id, PILOT_LESSON_ID);
  assert.equal(lesson.sourceVersion, "A1課程內容_QA_corrected_v3.csv");
  assert.equal(lesson.sentence, "I am Amy.");
  assert.equal(lesson.passageId, "a1-u1-l1-p01");
  assert.equal(lesson.sentenceOrder, 1);
  assert.equal(lesson.sentencePatternId, "be-identification");
  assert.deepEqual(lesson.tokens.map((token) => token.answer), ["I", "am", "Amy"]);
  assert.ok(lesson.tokens.every((token) => !token.answer.includes(" ")));
  assert.ok(lesson.tokens.every((token) => token.contextPos === token.partOfSpeech));
  assert.ok(lesson.tokens.every((token) => token.prompt && token.promptType));
  assert.ok(lesson.tokens.every((token) => token.lexemeId && token.senseId));
  assert.ok(lesson.tokens.every((token) => token.audioStatus === "pending"));
  assert.ok(lesson.tokens.every((token) => !token.wordAudioSource));
});

test("keeps word answers separate while preserving chunk-level meaning", async () => {
  const rows = await loadRows();
  const getUpRows = rows
    .filter((row) => row.lesson_id === "a1-u5-l2" && row.chunk_id === "get-up")
    .sort((left, right) => Number(left.token_order) - Number(right.token_order));

  assert.deepEqual(getUpRows.map((row) => row.answer), ["get", "up"]);
  assert.ok(getUpRows.every((row) => row.chunk_text === "get up"));
  assert.ok(getUpRows.every((row) => row.chunk_translation === "起床"));
  assert.ok(getUpRows.every((row) => row.chunk_note.includes("片語動詞")));
});

test("records lexeme, sense, sentence-pattern, and completion progress", async () => {
  const lesson = buildPilotLessonFromRows(await loadRows());
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

  const sentencePatternProgress = recordLearningEntityCompletion(
    {},
    lesson.sentencePatternId,
    lesson.id,
    "2026-07-24T00:02:00.000Z",
  );
  const localStoragePayload = JSON.stringify({
    schemaVersion: 2,
    completedLessonIds: [lesson.id],
    lexemeProgress,
    senseProgress,
    sentencePatternProgress,
  });
  const restored = JSON.parse(localStoragePayload);

  assert.deepEqual(Object.keys(restored.lexemeProgress), ["i", "be", "amy"]);
  assert.equal(restored.lexemeProgress.be.correctAnswers, 1);
  assert.deepEqual(restored.lexemeProgress.be.completedLessonIds, [lesson.id]);
  assert.deepEqual(
    restored.sentencePatternProgress["be-identification"].completedLessonIds,
    [lesson.id],
  );
  assert.deepEqual(restored.completedLessonIds, [PILOT_LESSON_ID]);
});

test("reveals the correct sentence and unlocks the next step after three rebuild errors", () => {
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

  assert.equal(first.revealed, false);
  assert.equal(second.revealed, false);
  assert.equal(third.attempts, 3);
  assert.equal(third.revealed, true);
  assert.deepEqual(third.displayValues, expected);
  assert.deepEqual(third.statuses, [
    "revealed",
    "revealed",
    "revealed",
    "revealed",
  ]);
});

test("provides a separate complete 41-symbol KK phonetic practice set", () => {
  const vowels = kkPhoneticGroups.find((group) => group.id === "vowels");
  const consonants = kkPhoneticGroups.find((group) => group.id === "consonants");
  const entries = kkPhoneticGroups.flatMap((group) => group.entries);

  assert.equal(vowels.entries.length, 17);
  assert.equal(consonants.entries.length, 24);
  assert.equal(entries.length, 41);
  assert.equal(new Set(entries.map((entry) => entry.symbol)).size, 41);
  assert.equal(new Set(entries.map((entry) => entry.audioId)).size, 41);
  assert.ok(entries.every((entry) => entry.example && entry.translation && entry.tip));
  assert.ok(entries.every((entry) => /^https:\/\/upload\.wikimedia\.org\//.test(entry.audioSrc)));
  assert.ok(entries.every((entry) => entry.sourcePage && entry.author && entry.license));
});

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateEditorialRows } from "../app/curriculum/editorial-validation.ts";
import { parseCourseCsv, validateCourseRows } from "../app/curriculum/validation.ts";
import { sentenceSpellingUnits, normalizeSentenceForComparison } from "../app/curriculum/sentence-words.ts";
import { validateReadingExerciseData, validatePatternExerciseData, patternCoverageSummary } from "../app/a1-exercises.ts";
import { wordAccuracy } from "../app/assessment-scoring.ts";
import { evaluatePassageRebuild } from "../app/passage-flow.ts";
import { evaluateRebuildAttempt } from "../app/rebuild-flow.ts";

const read = (file) => fs.readFileSync(new URL(`../public/data/${file}`, import.meta.url), "utf8");
const rows = {
  A1: parseCourseCsv(read("a1-course-v3.csv")),
  A2: parseCourseCsv(read("a2-course-v1.csv")),
  B1: parseCourseCsv(read("b1-course-v1.csv")),
  B2: parseCourseCsv(read("b2-course-v1.csv")),
};
const b1Reading = JSON.parse(read("b1-reading-exercises.json"));
const b1Patterns = JSON.parse(read("b1-pattern-exercises.json"));
const validateReading = (data) => validateReadingExerciseData(data, rows.B1, b1Patterns, [...rows.A1, ...rows.A2]);

test("sentence punctuation preserves ordered one-word answers and unknown input remains visible", () => {
  assert.deepEqual(sentenceSpellingUnits("After I arrived home, I called my friend."),
    ["After", "I", "arrived", "home", "I", "called", "my", "friend"]);
  assert.deepEqual(sentenceSpellingUnits("We consider long-term impact."),
    ["We", "consider", "long", "term", "impact"]);
  assert.deepEqual(sentenceSpellingUnits("It is eight o'clock."), ["It", "is", "eight", "o'clock"]);
  assert.equal(normalizeSentenceForComparison("We consider long-term impact."),
    normalizeSentenceForComparison("We consider long term impact"));
  assert.notEqual(normalizeSentenceForComparison("I have an apple 123"),
    normalizeSentenceForComparison("I have an apple."));
  assert.notEqual(normalizeSentenceForComparison("I have an apple 中文"),
    normalizeSentenceForComparison("I have an apple."));
});

test("punctuated course sentences still reject missing or extra spelling units", () => {
  const changed = structuredClone(rows.B1);
  const lesson = changed.filter((row) => row.lesson_id === "b1-u01-l04");
  lesson.forEach((row) => { row.sentence = "After I arrived home today, I called my friend."; });
  const report = validateCourseRows(changed);
  assert.equal(report.valid, false);
  assert.ok(report.validationErrors.some((error) => error.includes("occurrence 無法重建")));
});

test("sentence scoring and passage rebuild handle punctuation without ignoring extra answers", () => {
  const expected = "After I arrived home, I called my friend.";
  const answer = "After I arrived home I called my friend";
  const lessons = [{ sentence: expected, sentenceId: "editorial-punctuation" }];
  assert.equal(wordAccuracy(answer, expected), 100);
  assert.equal(evaluatePassageRebuild([answer], lessons)[0].correct, true);
  for (const suffix of [" today", " 123", " 中文"]) {
    assert.ok(wordAccuracy(answer + suffix, expected) < 100);
    assert.equal(evaluatePassageRebuild([answer + suffix], lessons)[0].correct, false);
  }
  assert.equal(wordAccuracy("We consider long term impact", "We consider long-term impact."), 100);
});

test("sentence rebuild requires every answer and rejects empty or extra input arrays", () => {
  const expected = ["I", "am", "Amy"];
  assert.deepEqual(evaluateRebuildAttempt([], expected, 0).statuses,
    ["missing", "missing", "missing"]);
  const missing = evaluateRebuildAttempt(["I"], expected, 0);
  assert.equal(missing.correct, false);
  assert.deepEqual(missing.statuses, ["correct", "missing", "missing"]);
  for (const values of [[], ["I"], ["I", "am", "Amy", "today"], ["I", "am", "Amy", ""]]) {
    assert.equal(evaluateRebuildAttempt(values, expected, 0).correct, false);
  }
  const revealed = evaluateRebuildAttempt(["I"], expected, 2);
  assert.equal(revealed.revealed, true);
  assert.deepEqual(revealed.displayValues, expected);
  assert.equal(evaluateRebuildAttempt(expected, expected, 0).correct, true);
  assert.equal(evaluateRebuildAttempt([], [], 0).correct, false);
});

test("course validation rejects contradictory sentence metadata and incomplete chunks", () => {
  const changed = structuredClone(rows.A2);
  const index = changed.findIndex((row) => row.chunk_id === "last-night");
  changed[index].translation = "不一致的句子翻譯";
  changed[index].chunk_id = "";
  const report = validateCourseRows(changed);
  assert.equal(report.valid, false);
  assert.ok(report.validationErrors.some((error) => error.includes("句子共用欄位不一致")));
  assert.ok(report.validationErrors.some((error) => error.includes("連續且一致的逐字")));
});

test("canonical lexical validation rejects inflected identities and cross-level lemma drift", () => {
  const changed = structuredClone([...rows.A1, ...rows.A2, ...rows.B1, ...rows.B2]);
  const form = changed.find((row) => row.answer === "was");
  form.lexeme_id = "was";
  form.lemma = "was";
  const object = changed.find((row) => row.level === "B1" && row.answer === "me");
  object.lemma = "me";
  const errors = validateEditorialRows(changed);
  assert.ok(errors.some((error) => error.message.includes("原形 be")));
  assert.ok(errors.some((error) => error.message.includes("me 對應不同 lemma")));
});

test("editorial checks reject known context POS regressions and tolerate missing required fields", () => {
  const changed = structuredClone(rows.B1);
  const infinitive = changed.find((row) => row.occurrence_id === "b1-u02-l01-p01-s01-t03");
  infinitive.context_pos = "preposition 介系詞";
  const relative = changed.find((row) => row.occurrence_id === "b1-u03-l04-p01-s01-t06");
  relative.context_pos = "determiner 限定詞";
  const linking = changed.find((row) => row.occurrence_id === "b1-u03-l01-p01-s01-t05");
  linking.context_pos = "auxiliary verb 助動詞";
  const messages = validateEditorialRows(changed).map((issue) => issue.message);
  assert.ok(messages.some((message) => message.includes("不定詞標記")));
  assert.ok(messages.some((message) => message.includes("引導子句的 that")));
  assert.ok(messages.some((message) => message.includes("be 連接主詞")));
  assert.doesNotThrow(() => validateEditorialRows([{}]));
});

test("CSV-backed passages reject future vocabulary even without custom sentence metadata", () => {
  const missingMetadata = structuredClone(b1Reading);
  delete missingMetadata.passages[0].questions[0].optionMetadata;
  assert.ok(validateReading(missingMetadata).errors.some((error) => error.includes("缺少選項先備內容 metadata")));

  const changed = structuredClone(b1Reading);
  const passage = changed.passages[0];
  assert.equal(passage.sentences, undefined);
  const question = passage.questions[0];
  const index = question.options.findIndex((option) => option !== question.correctAnswer);
  const previousText = question.options[index];
  question.options[index] = "Privacy risks.";
  const metadata = question.optionMetadata.find((option) => option.text === previousText);
  Object.assign(metadata, { text: "Privacy risks.", requiredLexemeIds: ["privacy", "risk"], requiredChunkIds: [] });
  const report = validateReading(changed);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("提前使用 lexeme") && error.includes("privacy")));
});

test("reading options reject punctuation-only duplicates and substring-only answer evidence", () => {
  const duplicate = structuredClone(b1Reading);
  const question = duplicate.passages[0].questions[0];
  const old = question.options[1];
  question.options[1] = ` ${question.options[0].toUpperCase()} `;
  question.optionMetadata.find((option) => option.text === old).text = question.options[1];
  assert.ok(validateReading(duplicate).errors.some((error) => error.includes("選項不可重複")));

  const substring = structuredClone(b1Reading);
  const first = substring.passages[0].questions[0];
  const correctIndex = first.options.indexOf(first.correctAnswer);
  const option = first.optionMetadata.find((entry) => entry.text === first.correctAnswer);
  first.correctAnswer = "He";
  first.options[correctIndex] = "He";
  Object.assign(option, { text: "He", requiredLexemeIds: ["he"], requiredChunkIds: [] });
  first.evidenceSentenceIds = [rows.B1[0].sentence_id];
  assert.ok(validateReading(substring).errors.some((error) => error.includes("答案與來源文章不一致")));
});

test("text-response options reject nonexistent and future source sentence IDs", () => {
  const reading = JSON.parse(read("a1-reading-exercises.json"));
  const patterns = JSON.parse(read("a1-pattern-exercises.json"));
  const futureSentence = rows.A1.find((row) => row.lesson_id === "a1-u8-l4").sentence_id;
  for (const sourceSentenceId of ["not-real", futureSentence]) {
    const changed = structuredClone(reading);
    changed.textResponses[0].options[0].sourceSentenceId = sourceSentenceId;
    const result = validateReadingExerciseData(changed, rows.A1, patterns);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes(sourceSentenceId)));
    assert.ok(result.errors.some((error) => error.includes(
      sourceSentenceId === "not-real" ? "找不到選項來源句" : "選項提前使用",
    )));
  }
});

test("passage options cannot claim unrelated but already learned chunks", () => {
  const changed = structuredClone(b1Reading);
  const question = changed.passages[0].questions[0];
  const option = question.optionMetadata.find((entry) => !entry.text.toLowerCase().includes("have worked"));
  option.requiredChunkIds = ["have-worked"];
  const result = validateReading(changed);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("未包含所宣告的 chunk：have-worked")));
});

test("legacy transfer examples without slots cannot claim unused learned chunks", () => {
  const patterns = JSON.parse(read("a1-pattern-exercises.json"));
  const example = patterns.patterns.flatMap((pattern) => pattern.examples)
    .find((entry) => entry.id === "action-at-time-watch-seven");
  assert.ok(example);
  assert.equal(example.slotValues, undefined);
  example.requiredChunkIds = ["at-night"];
  const result = validatePatternExerciseData(patterns, rows.A1);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("未包含所宣告的 chunk：at-night")));
});

test("optional chunk and pattern IDs must still use stable ASCII identifiers", () => {
  for (const field of ["chunk_id", "pattern_id"]) {
    const changed = structuredClone(rows.A2);
    const original = changed.find((row) => row[field])?.[field];
    if (original) {
      changed.filter((row) => row[field] === original).forEach((row) => { row[field] = "invalid ID"; });
    } else {
      changed[0][field] = "invalid ID";
    }
    const report = validateCourseRows(changed);
    assert.equal(report.valid, false);
    assert.ok(report.validationErrors.some((error) => error.includes(`${field} 必須是小寫 ASCII 穩定 ID`)));
  }
});

test("pattern coverage separates missing enabled exercises from explicitly deferred patterns", () => {
  const patterns = JSON.parse(read("a1-pattern-exercises.json"));
  const enabled = patterns.patterns.find((pattern) => pattern.enabledForTransfer);
  const deferred = patterns.patterns.find((pattern) => !pattern.enabledForTransfer);
  enabled.examples = [];
  patterns.patterns = patterns.patterns.filter((pattern) => pattern.id !== deferred.id);
  const result = patternCoverageSummary(patterns, rows.A1);
  assert.deepEqual(result.uncoveredPatternIds, [enabled.id]);
  assert.deepEqual(result.unconfiguredPatternIds, [deferred.id]);
  assert.equal(result.deferredPatternIds.length, 15);
});

test("legacy A1 reading and original A2 unit 1 remain valid without option metadata", () => {
  for (const level of ["A1", "A2"]) {
    const stem = level.toLowerCase();
    const report = validateReadingExerciseData(
      JSON.parse(read(`${stem}-reading-exercises.json`)), rows[level],
      JSON.parse(read(`${stem}-pattern-exercises.json`)), level === "A2" ? rows.A1 : [],
    );
    assert.equal(report.valid, true, report.errors.join("\n"));
  }
});

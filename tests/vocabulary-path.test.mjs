import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parseVocabularyTargets } from "../app/vocabulary-targets.ts";
import {
  buildVocabularyPathExposureId,
  buildVocabularyPathLessonTasks,
  buildVocabularyPathReviewTasks,
  meetsVocabularyPathGoal,
  parseVocabularyPath,
  summarizeVocabularyPath,
  validateVocabularyPath,
  VOCABULARY_PATH_REVIEW_LIMIT,
  vocabularyPathDueSteps,
} from "../app/vocabulary-path.ts";
import { recordGlobalVocabularyEvidence } from "../app/vocabulary-progress.ts";

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../public/data/${name}`, import.meta.url), "utf8"));
const targets = parseVocabularyTargets(read("vocabulary-targets-v2.json"));
const data = parseVocabularyPath(read("vocabulary-path-v1.json"), targets);
const byId = new Map(targets.entries.map((entry) => [entry.lexemeId, entry]));
const wordWith = (masteryTarget) => data.lessons.flatMap((lesson) => lesson.lexemeIds)
  .find((id) => byId.get(id).masteryTarget === masteryTarget);
const add = (progress, lexemeId, kind, date, id = `test:${date}:${kind}:${lexemeId}`) =>
  recordGlobalVocabularyEvidence(progress, {
    lexemeIds: [lexemeId], kind, evidenceId: id, studiedAt: `${date}T04:00:00.000Z`, studyDate: date, sourceLevel: "A1",
  });
const study = (progress, lexemeId, date) => add(progress, lexemeId, "exposure", date, buildVocabularyPathExposureId(date, lexemeId));
const recognize = (progress, lexemeId, date, correct = true) => {
  const next = add(progress, lexemeId, "recognitionAttempt", date, `test:${date}:recognition:${lexemeId}`);
  return correct ? add(next, lexemeId, "recognitionCorrect", date, `test:${date}:recognition:${lexemeId}`) : next;
};
const spell = (progress, lexemeId, date) => {
  const next = add(progress, lexemeId, "spellingAttempt", date, `test:${date}:spelling:${lexemeId}`);
  return add(next, lexemeId, "spellingCorrect", date, `test:${date}:spelling:${lexemeId}`);
};
const apply = (progress, lexemeId, date) => {
  const next = add(progress, lexemeId, "applicationAttempt", date, `test:${date}:application:${lexemeId}`);
  return add(next, lexemeId, "applicationCorrect", date, `test:${date}:application:${lexemeId}`);
};

test("covers all 3000 targets exactly once in 5 stages, 300 lessons and 10 words per lesson", () => {
  assert.equal(data.stages.length, 5);
  assert.equal(data.lessons.length, 300);
  assert.equal(data.status, "pilot_review_required");
  const words = data.lessons.flatMap((lesson) => lesson.lexemeIds);
  assert.equal(words.length, 3000);
  assert.equal(new Set(words).size, 3000);
  assert.deepEqual([...words].sort(), targets.entries.map((entry) => entry.lexemeId).sort());
  for (const stage of data.stages) assert.equal(stage.lessonIds.length, 60);
  for (const lesson of data.lessons) assert.equal(lesson.lexemeIds.length, 10);
});

test("orders common words first and brings practical everyday words forward", () => {
  const meanPriority = (stage) => {
    const words = data.lessons.filter((lesson) => lesson.stageId === stage.id).flatMap((lesson) => lesson.lexemeIds);
    return words.reduce((sum, id) => sum + byId.get(id).curriculumPriority, 0) / words.length;
  };
  const means = data.stages.map(meanPriority);
  for (let index = 1; index < means.length; index += 1) assert.ok(means[index] > means[index - 1]);
  const stageOf = (word) => data.lessons.find((lesson) => lesson.lexemeIds.includes(word)).stageId;
  const supplements = targets.entries.filter((entry) =>
    entry.curriculumPriority > 132 && !entry.sourceRefs.some((source) => source.sourceType === "frequency"));
  assert.ok(supplements.length > 0);
  for (const entry of supplements) assert.ok(["stage-1", "stage-2", "stage-3"].includes(stageOf(entry.lexemeId)), entry.lexemeId);
});

test("rejects missing, repeated and foreign words", () => {
  assert.equal(validateVocabularyPath(data, targets).valid, true);
  const copy = () => JSON.parse(JSON.stringify(data));
  const repeated = copy();
  repeated.lessons[1].lexemeIds[0] = repeated.lessons[0].lexemeIds[0];
  assert.equal(validateVocabularyPath(repeated, targets).valid, false);
  const foreign = copy();
  foreign.lessons[0].lexemeIds[0] = "notatargetword";
  assert.equal(validateVocabularyPath(foreign, targets).valid, false);
  const short = copy();
  short.lessons[0].lexemeIds.pop();
  assert.equal(validateVocabularyPath(short, targets).valid, false);
  const approved = copy();
  approved.status = "complete";
  assert.equal(validateVocabularyPath(approved, targets).valid, false);
});

test("a receptive word reaches its goal after correct recognition on two dates", () => {
  const word = wordWith("receptive");
  let progress = study({}, word, "2026-11-24");
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2026-11-24"), ["recognition"]);
  progress = recognize(progress, word, "2026-11-24");
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2026-11-24"), []);
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2026-11-25"), ["recognition"]);
  progress = recognize(progress, word, "2026-11-25");
  assert.equal(meetsVocabularyPathGoal(progress[word], "receptive"), true);
});

test("an active word needs two spelling dates and a later sentence", () => {
  const word = wordWith("active");
  let progress = study({}, word, "2026-11-24");
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "active", "2026-11-24"), ["recognition", "spelling"]);
  progress = spell(recognize(progress, word, "2026-11-24"), word, "2026-11-24");
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "active", "2026-11-24"), []);
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "active", "2026-11-25"), ["recognition", "spelling", "application"]);
  progress = apply(spell(recognize(progress, word, "2026-11-25"), word, "2026-11-25"), word, "2026-11-25");
  assert.equal(meetsVocabularyPathGoal(progress[word], "active"), true);
});

test("a wrong first answer cannot be retried for credit the same day", () => {
  const word = wordWith("receptive");
  let progress = recognize(study({}, word, "2026-11-24"), word, "2026-11-24", false);
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2026-11-24"), []);
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2026-11-25"), ["recognition"]);
  progress = recognize(progress, word, "2026-11-25");
  assert.equal(meetsVocabularyPathGoal(progress[word], "receptive"), false);
});

test("words that met their goal return for spaced checks and then graduate", () => {
  const word = wordWith("receptive");
  let progress = recognize(recognize(study({}, word, "2026-11-01"), word, "2026-11-01"), word, "2026-11-02");
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2026-11-04"), []);
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2026-11-05"), ["recognition"]);
  for (const date of ["2026-11-05", "2026-11-12", "2026-12-03", "2027-01-17"]) {
    assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", date), ["recognition"], date);
    progress = recognize(progress, word, date);
  }
  assert.deepEqual(vocabularyPathDueSteps(progress[word], "receptive", "2028-01-01"), []);
});

test("lesson tasks teach before testing and skip what is already done", () => {
  const lesson = data.lessons[0];
  const tasks = buildVocabularyPathLessonTasks(lesson, targets, {}, "2026-11-24");
  const order = { study: 0, recognition: 1, spelling: 2, application: 3 };
  assert.deepEqual(tasks.map((task) => order[task.kind]), tasks.map((task) => order[task.kind]).sort((a, b) => a - b));
  assert.equal(tasks.filter((task) => task.kind === "study").length, 10);
  assert.equal(tasks.filter((task) => task.kind === "recognition").length, 10);
  assert.equal(tasks.filter((task) => task.kind === "application").length, 0);
  let progress = {};
  for (const id of lesson.lexemeIds) {
    progress = recognize(study(progress, id, "2026-11-24"), id, "2026-11-24");
    if (byId.get(id).masteryTarget === "active") progress = spell(progress, id, "2026-11-24");
  }
  assert.deepEqual(buildVocabularyPathLessonTasks(lesson, targets, progress, "2026-11-24"), []);
  const summary = summarizeVocabularyPath(data, targets, progress, "2026-11-24");
  assert.equal(summary.startedCount, 10);
  assert.equal(summary.lessonStatus.get(lesson.id), "learned");
  assert.equal(summary.nextLesson?.id, data.lessons[1].id);
});

test("formal-course evidence alone never fills the path review queue", () => {
  const word = data.lessons[0].lexemeIds[0];
  const courseOnly = add({}, word, "exposure", "2026-11-24", "a1-u1-l1:exposure");
  assert.deepEqual(buildVocabularyPathReviewTasks(data, targets, courseOnly, "2026-11-25"), []);
  assert.deepEqual(summarizeVocabularyPath(data, targets, courseOnly, "2026-11-25").dueLexemeIds, []);
});

test("review rounds put unfinished words first and respect the limit", () => {
  let progress = {};
  for (const lesson of data.lessons.slice(0, 5)) {
    for (const id of lesson.lexemeIds) progress = study(progress, id, "2026-11-24");
  }
  const tasks = buildVocabularyPathReviewTasks(data, targets, progress, "2026-11-25");
  assert.equal(tasks.length, VOCABULARY_PATH_REVIEW_LIMIT);
  assert.equal(tasks[0].lexemeId, data.lessons[0].lexemeIds[0]);
});

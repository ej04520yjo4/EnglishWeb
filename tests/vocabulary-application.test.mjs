import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { parseVocabularyTargets } from "../app/vocabulary-targets.ts";
import { localDateKey } from "../app/local-date.ts";
import { parseVocabularyApplications, validateVocabularyApplications, buildVocabularyApplicationQuestion, gradeVocabularyApplication, recordVocabularyApplicationResult, targetFormMatchesLexeme } from "../app/vocabulary-application.ts";

const targets = parseVocabularyTargets(JSON.parse(fs.readFileSync(new URL("../public/data/vocabulary-targets-v2.json", import.meta.url), "utf8")));
const data = parseVocabularyApplications(JSON.parse(fs.readFileSync(new URL("../public/data/vocabulary-applications-v1.json", import.meta.url), "utf8")), targets);
const time = new Date(2026, 9, 15, 12, 0, 0).toISOString();
const studyDate = localDateKey(new Date(time));
const question = () => buildVocabularyApplicationQuestion(data, targets, "book", studyDate);
const source = data.entries.find((entry) => entry.lexemeId === "book");
const record = (progress, q, answer, options = {}) => recordVocabularyApplicationResult(progress, data, targets, q, answer, { studiedAt: time, ...options });

test("all 3000 canonical targets have one real sourced application and no formal curriculum IDs", () => {
  assert.equal(data.entries.length, 3000);
  assert.equal(data.coverage, "complete");
  assert.equal(new Set(data.entries.map((entry) => entry.lexemeId)).size, 3000);
  assert.deepEqual(data.entries.map((entry) => entry.lexemeId), targets.entries.map((entry) => entry.lexemeId));
  for (const entry of data.entries) {
    assert.equal(entry.qaStatus, "pilot_review_required");
    assert.ok(!("lessonId" in entry));
    assert.match(entry.translationZhTw, /\p{Script=Han}/u);
    assert.ok(targetFormMatchesLexeme(entry.lexemeId, entry.targetForm));
  }
});

test("application question contains a target word and Chinese prompt but not the full answer", () => {
  const q = question();
  assert.equal(q.mode, "application");
  assert.equal(q.targetForm, source.targetForm);
  assert.equal(q.promptZhTw, source.translationZhTw);
  assert.ok(!("answer" in q));
  assert.ok(!("sentence" in q));
  assert.throws(() => buildVocabularyApplicationQuestion(data, targets, "book", "2026-02-30"), /日期/);
});

test("whole-sentence comparison rejects extra, missing, wrong and unknown characters", () => {
  assert.equal(gradeVocabularyApplication("i have an apple", "I have an apple."), true);
  for (const answer of ["I have an apple today", "I have apple", "I has an apple", "I have an apple 2", "I have an apple 中文"]) {
    assert.equal(gradeVocabularyApplication(answer, "I have an apple."), false, answer);
  }
});

test("a clean first whole-sentence answer records only application evidence for its target", () => {
  const initial = {};
  const next = record(initial, question(), source.sentence);
  assert.deepEqual(initial, {});
  assert.deepEqual(Object.keys(next), ["book"]);
  assert.equal(next.book.applicationAttemptEvidenceIds.length, 1);
  assert.equal(next.book.applicationCorrectEvidenceIds.length, 1);
  assert.equal(next.book.spellingCorrectEvidenceIds.length, 0);
  assert.equal(next.book.recognitionCorrectEvidenceIds.length, 0);
});

test("wrong first answer cannot turn into same-day correct credit after retry or reload", () => {
  const wrong = record({}, question(), "This is not the reference sentence.");
  const restored = JSON.parse(JSON.stringify(wrong));
  const retried = record(restored, question(), source.sentence);
  assert.equal(retried.book.applicationAttemptEvidenceIds.length, 1);
  assert.equal(retried.book.applicationCorrectEvidenceIds.length, 0);
  const tomorrow = new Date(2026, 9, 16, 12).toISOString();
  const nextQuestion = buildVocabularyApplicationQuestion(data, targets, "book", localDateKey(new Date(tomorrow)));
  const next = record(restored, nextQuestion, source.sentence, { studiedAt: tomorrow });
  assert.equal(next.book.applicationCorrectEvidenceIds.length, 1);
});

test("pasted and revealed sentences complete without clean application credit", () => {
  for (const options of [{ usedPaste: true }, { answerRevealed: true }]) {
    const next = record({}, question(), source.sentence, options);
    assert.equal(next.book.applicationAttemptEvidenceIds.length, 1);
    assert.equal(next.book.applicationCorrectEvidenceIds.length, 0);
  }
});

test("tampered source, question, dates and answer leaks fail closed", () => {
  for (const patch of [{ promptZhTw: "錯誤提示" }, { wordCount: 1 }, { sourceLevel: "B2" }, { id: "other" }, { answer: source.sentence }, { sentence: source.sentence }]) {
    assert.throws(() => record({}, { ...question(), ...patch }, source.sentence), /來源|格式/);
  }
  assert.throws(() => record({}, question(), source.sentence, { studiedAt: new Date(2026, 9, 16, 12).toISOString() }), /日期/);
  assert.throws(() => record({}, question(), source.sentence, { studiedAt: "invalid" }), /時間/);
  const broken = structuredClone(data);
  broken.entries[0].targetForm = "unrelated";
  assert.equal(validateVocabularyApplications(broken, targets).valid, false);
  broken.entries[0].targetForm = data.entries[0].targetForm;
  broken.entries[0].qaStatus = "human_reviewed";
  assert.equal(validateVocabularyApplications(broken, targets).valid, false);
});

test("a question from an older source revision cannot finish against updated sentences", () => {
  const updated = structuredClone(data);
  updated.sourceRevision = "a".repeat(64);
  updated.entries.find((entry) => entry.lexemeId === "book").sentence = "The book is on my desk.";
  assert.throws(() => recordVocabularyApplicationResult({}, updated, targets, question(), source.sentence, { studiedAt: time }), /來源/);
});

test("reviewed editorial corrections keep US usage and target senses", () => {
  const entries = new Map(data.entries.map((entry) => [entry.lexemeId, entry]));
  assert.equal(entries.get("fill").sentence, "Please fill out the form.");
  assert.equal(entries.get("sight").sentence, "These glasses improve my sight.");
  assert.equal(entries.get("possession").sentence, "This watch is my most valuable possession.");
  assert.match(entries.get("struggle").translationZhTw, /艱難/);
  assert.doesNotMatch(entries.get("mayor").translationZhTw, /市長開幕了/);
});

test("coverage cannot be inflated by duplicate IDs, missing words or dictionary templates", () => {
  const missing = structuredClone(data);
  missing.entries.pop();
  assert.equal(validateVocabularyApplications(missing, targets).valid, false);
  missing.coverage = "partial";
  assert.equal(validateVocabularyApplications(missing, targets).valid, true);
  const duplicate = structuredClone(data);
  duplicate.entries[1] = duplicate.entries[0];
  assert.equal(validateVocabularyApplications(duplicate, targets).valid, false);
  const padded = structuredClone(data);
  padded.entries[0].sentence = "The word I is spelled here.";
  assert.equal(validateVocabularyApplications(padded, targets).valid, false);
});

test("application generation is reproducible offline from the 60 original batches", () => {
  const output = execFileSync(process.execPath, ["--experimental-strip-types", "scripts/build-vocabulary-applications.mjs", "--check"], { cwd: new URL("..", import.meta.url), encoding: "utf8", windowsHide: true });
  assert.match(output, /3000\/3000; gaps 0/);
});

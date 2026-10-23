import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { parseCourseCsv } from "../app/curriculum/validation.ts";
import {
  CONVERSATION_REVIEW_STORAGE_KEY,
  advanceConversationReview,
  currentConversationReviewRecord,
  emptyConversationReviewStore,
  getConversationWeakTurns,
  isConversationReviewDue,
  markConversationReviewSupport,
  restoreConversationReviewStore,
  saveConversationReviewSession,
  startConversationReview,
  submitConversationReviewAnswer,
} from "../app/conversation-review.ts";
import { emptyConversationStore, parseConversationData } from "../app/conversation-practice.ts";
import { localDateKey } from "../app/local-date.ts";

const rows = ["a1-course-v3.csv", "a2-course-v1.csv"].flatMap((name) =>
  parseCourseCsv(fs.readFileSync(new URL(`../public/data/${name}`, import.meta.url), "utf8")),
);
const raw = JSON.parse(fs.readFileSync(new URL("../public/data/conversation-practice-v1.json", import.meta.url), "utf8"));
const data = await parseConversationData(raw, rows);
const now = new Date(2026, 9, 16, 12);
const today = localDateKey(now);
const scenario = data.scenarios[0];
const record = (overrides = {}) => ({
  attempts: 1,
  firstCorrect: true,
  usedHint: false,
  answerRevealed: false,
  usedPaste: false,
  usedSpeech: false,
  repairUsed: false,
  completed: true,
  ...overrides,
});
const key = (date, turnId, sourceRevision = data.sourceRevision) => `${sourceRevision}:${date}:${turnId}`;

test("weak-turn discovery uses latest source record, stable order, and ignores repair alone", () => {
  const [first, second, third] = scenario.turns;
  const store = emptyConversationStore(data);
  store.turnHistory[key("2026-10-10", first.id)] = record({ attempts: 2, firstCorrect: false, usedHint: true });
  store.turnHistory[key("2026-10-16", first.id)] = record();
  store.turnHistory[key("2026-10-16", second.id)] = record({ repairUsed: true });
  store.turnHistory[key("2026-10-15", third.id)] = record({ usedSpeech: true });
  store.turnHistory[key("2026-10-14", first.id, "conversation-v1-old-source")] = record({ attempts: 3, firstCorrect: false, answerRevealed: true });

  const weak = getConversationWeakTurns(data, store, scenario.id);
  assert.deepEqual(weak, [{
    turnId: third.id,
    reasons: ["使用語音轉文字"],
    studyDate: "2026-10-15",
  }]);
  assert.deepEqual(getConversationWeakTurns(data, { ...store, sourceRevision: "conversation-v1-old-source" }, scenario.id), []);
});

test("weak-turn reasons include every learning assistance signal", () => {
  const turn = scenario.turns[0];
  const store = emptyConversationStore(data);
  store.turnHistory[key(today, turn.id)] = record({
    attempts: 2,
    firstCorrect: false,
    usedHint: true,
    answerRevealed: true,
    usedPaste: true,
    usedSpeech: true,
  });
  assert.deepEqual(getConversationWeakTurns(data, store, scenario.id)[0].reasons, [
    "多次作答",
    "第一次未答對",
    "使用提示",
    "看過答案",
    "使用貼上",
    "使用語音轉文字",
  ]);
});

test("due helper safely handles full and focused review results", () => {
  const full = {
    id: `${scenario.id}:${today}:conversation-v1-test`,
    scenarioId: scenario.id,
    sourceRevision: data.sourceRevision,
    studyDate: "2026-10-10",
    dueDate: "2026-10-16",
    turnCount: 3,
    independentTurns: 1,
    assistedTurns: 2,
  };
  assert.equal(isConversationReviewDue(full, "2026-10-15"), false);
  assert.equal(isConversationReviewDue(full, "2026-10-16"), true);
  assert.equal(isConversationReviewDue(full, "2026-10-17"), true);
  assert.equal(isConversationReviewDue(null, "2026-10-16"), false);
  assert.equal(isConversationReviewDue(undefined, "2026-10-16"), false);
  assert.equal(isConversationReviewDue({ ...full, dueDate: "not-a-date" }, "2026-10-16"), false);
  assert.equal(isConversationReviewDue(full, "2026-02-30"), false);
});

test("focused review keeps authored order, reveals after three wrong answers, and requires retyping", () => {
  const weakTurns = [
    { turnId: scenario.turns[2].id, reasons: ["使用提示"], studyDate: today },
    { turnId: scenario.turns[0].id, reasons: ["多次作答"], studyDate: today },
  ];
  const session = startConversationReview(data, scenario.id, weakTurns, today);
  assert.deepEqual(session.turnIds, [scenario.turns[0].id, scenario.turns[2].id]);
  assert.equal(currentConversationReviewRecord(session).attempts, 0);
  const beforeSupport = structuredClone(session);
  let working = markConversationReviewSupport(data, session, "hint", now);
  assert.deepEqual(session, beforeSupport);
  assert.equal(currentConversationReviewRecord(working).usedHint, true);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    working = submitConversationReviewAnswer(data, working, "not the answer", now);
    assert.equal(currentConversationReviewRecord(working).answerRevealed, attempt === 3);
    assert.equal(currentConversationReviewRecord(working).completed, false);
  }
  assert.throws(() => advanceConversationReview(data, working, now), /完成目前/);
  working = submitConversationReviewAnswer(data, working, scenario.turns[0].answers[0], now);
  assert.equal(currentConversationReviewRecord(working).completed, true);
  working = advanceConversationReview(data, working, now);
  assert.equal(working.turnIndex, 1);
  assert.equal(currentConversationReviewRecord(working).answerRevealed, false);
});

test("save merges review assistance monotonically and creates a separate result", () => {
  const weakTurns = [{ turnId: scenario.turns[0].id, reasons: ["使用提示"], studyDate: today }];
  const initial = startConversationReview(data, scenario.id, weakTurns, today);
  const assisted = markConversationReviewSupport(data, initial, "paste", now);
  const store = emptyConversationReviewStore(data);
  const saved = saveConversationReviewSession(store, data, assisted);
  assert.equal(saved.active.records[scenario.turns[0].id].usedPaste, true);
  const staleClean = { ...initial, records: { ...initial.records } };
  const merged = saveConversationReviewSession(saved, data, staleClean);
  assert.equal(merged.active.records[scenario.turns[0].id].usedPaste, true);

  let finished = submitConversationReviewAnswer(data, assisted, scenario.turns[0].answers[0], now);
  finished = advanceConversationReview(data, finished, now);
  const complete = saveConversationReviewSession(merged, data, finished);
  assert.equal(complete.active, null);
  assert.deepEqual(complete.lastResult, {
    scenarioId: scenario.id,
    sourceRevision: data.sourceRevision,
    studyDate: today,
    turnCount: 1,
    independentTurns: 0,
    assistedTurns: 1,
  });
  assert.equal(CONVERSATION_REVIEW_STORAGE_KEY, "yingju-conversation-review-v1");
  assert.deepEqual(store, emptyConversationReviewStore(data));
});

test("restore preserves last result, drops cross-day active, and fails closed", () => {
  const weakTurns = [{ turnId: scenario.turns[0].id, reasons: ["使用提示"], studyDate: today }];
  const session = startConversationReview(data, scenario.id, weakTurns, today);
  const store = saveConversationReviewSession(emptyConversationReviewStore(data), data, session);
  const result = {
    scenarioId: scenario.id,
    sourceRevision: data.sourceRevision,
    studyDate: "2026-10-15",
    turnCount: 1,
    independentTurns: 1,
    assistedTurns: 0,
  };
  const withResult = { ...store, lastResult: result };
  assert.equal(restoreConversationReviewStore(JSON.stringify(withResult), data, today).active.turnIndex, 0);
  const nextDay = restoreConversationReviewStore(JSON.stringify(withResult), data, "2026-10-17");
  assert.equal(nextDay.active, null);
  assert.deepEqual(nextDay.lastResult, result);
  assert.throws(() => restoreConversationReviewStore("{", data, today), /有效 JSON/);
  assert.throws(() => restoreConversationReviewStore(JSON.stringify({ ...withResult, sourceRevision: "conversation-v1-other" }), data, today), /來源版本/);
  assert.throws(() => restoreConversationReviewStore(JSON.stringify({ ...withResult, active: { ...session, sourceRevision: "conversation-v1-other" } }), data, today), /作答回合無效/);
});

test("rejects attempted future records and a finished active review on restore", () => {
  const weakTurns = scenario.turns.map((turn) => ({ turnId: turn.id, reasons: ["多次作答"], studyDate: today }));
  const session = startConversationReview(data, scenario.id, weakTurns, today);
  const futureAttempt = {
    ...session,
    records: {
      ...session.records,
      [scenario.turns[1].id]: { ...session.records[scenario.turns[1].id], attempts: 1, firstCorrect: false },
    },
  };
  assert.throws(() => restoreConversationReviewStore(JSON.stringify({ ...emptyConversationReviewStore(data), active: futureAttempt }), data, today), /作答回合無效/);
  const finished = { ...session, turnIndex: session.turnIds.length - 1, finished: true, records: Object.fromEntries(session.turnIds.map((turnId) => [turnId, { ...session.records[turnId], attempts: 1, firstCorrect: true, completed: true }])) };
  assert.throws(() => restoreConversationReviewStore(JSON.stringify({ ...emptyConversationReviewStore(data), active: finished }), data, today), /作答回合無效/);
});

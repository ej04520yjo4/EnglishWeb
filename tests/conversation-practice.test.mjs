import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { parseCourseCsv } from "../app/curriculum/validation.ts";
import {
  advanceConversation, canStartConversation, conversationRevision, conversationResultId,
  emptyConversationStore, getConversationTurnRecord, gradeConversationAnswer,
  loadConversationData, markConversationSupport, parseConversationData,
  restoreConversationStore, saveConversationSession, startConversation,
  submitConversationAnswer,
} from "../app/conversation-practice.ts";
import { localDateKey } from "../app/local-date.ts";

const rows = ["a1-course-v3.csv", "a2-course-v1.csv"].flatMap((name) => parseCourseCsv(fs.readFileSync(new URL(`../public/data/${name}`, import.meta.url), "utf8")));
const raw = JSON.parse(fs.readFileSync(new URL("../public/data/conversation-practice-v1.json", import.meta.url), "utf8"));
const parsedData = await parseConversationData(raw, rows);
const data = () => parsedData;
const now = new Date(2026, 9, 16, 12);
const today = localDateKey(now);
const intro = () => data().scenarios[0];
const initial = () => startConversation(data(), intro().id, today);
const finish = (session, store = emptyConversationStore(data())) => {
  while (!session.finished) {
    const turn = data().scenarios.find((entry) => entry.id === session.scenarioId).turns[session.turnIndex];
    session = submitConversationAnswer(data(), session, turn.answers[0], now);
    store = saveConversationSession(store, data(), session);
    session = advanceConversation(data(), session, now);
    store = saveConversationSession(store, data(), session);
  }
  return { session, store, result: store.results[conversationResultId(session.scenarioId, today, session.sourceRevision)] };
};

test("validates four versioned pilot dialogues with real formal prerequisites and prior teaching", async () => {
  const parsed = data();
  assert.equal(parsed.scenarios.length, 4);
  assert.equal(parsed.scenarios.flatMap((scenario) => scenario.turns).length, 12);
  assert.equal(parsed.sourceRevision, await conversationRevision(parsed.scenarios));
  assert.equal(parsed.sourceRevision, `conversation-v1-${createHash("sha256").update(JSON.stringify(parsed.scenarios)).digest("hex")}`);
  for (const scenario of parsed.scenarios) {
    assert.equal(scenario.turns.length, 3);
    for (const turn of scenario.turns) {
      assert.ok(scenario.preparation.some((phrase) => phrase.english === turn.partnerEnglish));
      for (const answer of turn.answers) assert.ok(scenario.preparation.some((phrase) => phrase.english === answer));
    }
  }
});

test("rejects false prerequisites, untaught responses, duplicate IDs and human-approval claims", async () => {
  for (const mutate of [
    (copy) => { copy.scenarios[0].requiredLessonIds = ["a1-u99-l1"]; },
    (copy) => { copy.scenarios[0].turns[0].answers = ["An unseen response."]; },
    (copy) => { copy.scenarios[1].id = copy.scenarios[0].id; },
    (copy) => { copy.qaStatus = "approved"; },
    (copy) => { copy.scenarios[0].turns[0].partnerEnglish = "An unseen question?"; },
  ]) {
    const copy = structuredClone(raw);
    mutate(copy);
    copy.sourceRevision = await conversationRevision(copy.scenarios);
    await assert.rejects(parseConversationData(copy, rows));
  }
  const changed = structuredClone(raw);
  changed.scenarios[0].title += "changed";
  await assert.rejects(parseConversationData(changed, rows), /指紋/);
});

test("normal mode respects real lesson completion and level access; preview grants no progress", () => {
  const before = structuredClone(rows);
  const scenario = data().scenarios[1];
  assert.equal(canStartConversation(scenario, [], true, false), false);
  assert.equal(canStartConversation(scenario, scenario.requiredLessonIds, false, false), false);
  assert.equal(canStartConversation(scenario, scenario.requiredLessonIds, true, false), true);
  assert.equal(canStartConversation(scenario, [], false, true), true);
  assert.deepEqual(rows, before);
});

test("accepts taught alternatives and contractions but rejects extra words or partial responses", () => {
  const turn = intro().turns[0];
  for (const answer of ["My name is Ben.", "I am Ben", "I’m Ben!", "  my   name is Ben  "]) assert.equal(gradeConversationAnswer(answer, turn), true);
  for (const answer of ["Ben", "My name is Ben today.", "My name is Amy.", "I am Ben 123"]) assert.equal(gradeConversationAnswer(answer, turn), false);
});

test("reveals only after three wrong answers and requires an explicit correct retype and advance", () => {
  let session = initial();
  assert.throws(() => advanceConversation(data(), session, now), /先完成/);
  for (let attempt = 1; attempt <= 3; attempt++) {
    session = submitConversationAnswer(data(), session, "wrong", now);
    assert.equal(session.turnIndex, 0);
    assert.equal(getConversationTurnRecord(session).answerRevealed, attempt === 3);
    assert.equal(getConversationTurnRecord(session).completed, false);
  }
  const saved = saveConversationSession(emptyConversationStore(data()), data(), session);
  session = restoreConversationStore(JSON.stringify(saved), data(), today).active;
  assert.equal(getConversationTurnRecord(session).attempts, 3);
  session = submitConversationAnswer(data(), session, intro().turns[0].answers[0], now);
  assert.equal(session.turnIndex, 0);
  assert.equal(getConversationTurnRecord(session).answerRevealed, true);
  session = advanceConversation(data(), session, now);
  assert.equal(session.turnIndex, 1);
  assert.equal(getConversationTurnRecord(session).answerRevealed, false);
  assert.equal(getConversationTurnRecord(session).usedPaste, false);
});

test("stores all four complete dialogues, schedules clean recall after three local days", () => {
  for (const scenario of data().scenarios) {
    const result = finish(startConversation(data(), scenario.id, today)).result;
    assert.equal(result.independentTurns, 3);
    assert.equal(result.assistedTurns, 0);
    assert.equal(result.dueDate, "2026-10-19");
  }
});

test("hint and paste support survives reload; assisted dialogue is due tomorrow", () => {
  for (const kind of ["hint", "paste"]) {
    const session = markConversationSupport(data(), initial(), kind, now);
    const store = saveConversationSession(emptyConversationStore(data()), data(), session);
    const resumed = restoreConversationStore(JSON.stringify(store), data(), today);
    const { result } = finish(resumed.active, resumed);
    assert.equal(result.independentTurns, 2);
    assert.equal(result.assistedTurns, 1);
    assert.equal(result.dueDate, "2026-10-17");
  }
});

test("asking for repetition is a communication strategy, not an incorrect answer", () => {
  const session = markConversationSupport(data(), initial(), "repair", now);
  assert.equal(getConversationTurnRecord(session).repairUsed, true);
  assert.equal(getConversationTurnRecord(session).attempts, 0);
  assert.equal(finish(session).result.independentTurns, 3);
});

test("same-day restart cannot erase the first wrong answer, and completed results are immutable", () => {
  const wrong = submitConversationAnswer(data(), initial(), "wrong", now);
  const store = saveConversationSession(emptyConversationStore(data()), data(), wrong);
  const first = finish(initial(), store);
  assert.equal(first.result.independentTurns, 2);
  const second = finish(initial(), first.store);
  assert.deepEqual(second.result, first.result);
  assert.equal(Object.keys(second.store.results).length, 1);
});

test("restores current-day activity but expires it at midnight without adding completion", () => {
  const store = saveConversationSession(emptyConversationStore(data()), data(), initial());
  assert.equal(restoreConversationStore(JSON.stringify(store), data(), today).active.turnIndex, 0);
  assert.equal(restoreConversationStore(JSON.stringify(store), data(), "2026-10-17").active, null);
  assert.deepEqual(restoreConversationStore(JSON.stringify(store), data(), "2026-10-17").results, {});
  assert.throws(() => submitConversationAnswer(data(), initial(), "I am Ben.", new Date(2026, 9, 17, 0, 1)), /日期已變更/);
});

test("source updates keep historical results but discard the in-progress old dialogue", async () => {
  const store = finish(initial()).store;
  store.active = initial();
  const newer = structuredClone(raw);
  newer.scenarios[0].title += " 新版";
  newer.sourceRevision = await conversationRevision(newer.scenarios);
  const restored = restoreConversationStore(JSON.stringify(store), await parseConversationData(newer, rows), today);
  assert.equal(restored.active, null);
  assert.deepEqual(restored.results, store.results);
  const updated = await parseConversationData(newer, rows);
  let session = startConversation(updated, updated.scenarios[0].id, today);
  let nextStore = restored;
  while (!session.finished) {
    session = submitConversationAnswer(updated, session, updated.scenarios[0].turns[session.turnIndex].answers[0], now);
    session = advanceConversation(updated, session, now);
    nextStore = saveConversationSession(nextStore, updated, session);
  }
  assert.equal(Object.keys(nextStore.results).length, 2);
  assert.ok(nextStore.results[conversationResultId(session.scenarioId, today, updated.sourceRevision)]);
  for (const [id, previous] of Object.entries(store.results)) assert.deepEqual(nextStore.results[id], previous);
});

test("current-source results reject unknown scenarios and mismatched turn counts without erasing history", () => {
  const saved = finish(initial()).store;
  const resultId = conversationResultId(intro().id, today, data().sourceRevision);
  const unknown = structuredClone(saved);
  const unknownId = conversationResultId("conversation-unknown", today, data().sourceRevision);
  unknown.results[unknownId] = { ...unknown.results[resultId], id: unknownId, scenarioId: "conversation-unknown" };
  assert.throws(() => restoreConversationStore(JSON.stringify(unknown), data(), today), /情境不存在/);
  const mismatch = structuredClone(saved);
  mismatch.results[resultId].turnCount = 4;
  mismatch.results[resultId].independentTurns = 4;
  assert.throws(() => restoreConversationStore(JSON.stringify(mismatch), data(), today), /回合數不符/);
  const historicalId = `conversation-unknown:${today}`;
  unknown.results[historicalId] = { ...unknown.results[unknownId], id: historicalId, sourceRevision: "conversation-v1-old-source" };
  delete unknown.results[unknownId];
  assert.deepEqual(restoreConversationStore(JSON.stringify(unknown), data(), today).results, unknown.results);
});

test("malformed saved records fail visibly instead of silently overwriting learner data", () => {
  assert.throws(() => restoreConversationStore("{", data(), today), /未覆寫/);
  const store = saveConversationSession(emptyConversationStore(data()), data(), initial());
  store.active.turnIndex = 2;
  assert.throws(() => restoreConversationStore(JSON.stringify(store), data(), today), /跳過/);
  assert.throws(() => startConversation(data(), intro().id, "2026-02-30"), /日期/);
});

test("source fetch failure remains an explicit isolated error", async () => {
  await assert.rejects(loadConversationData(rows, async () => new Response("", { status: 503 })), /503/);
  const loaded = await loadConversationData(rows, async () => new Response(JSON.stringify(raw)));
  assert.equal(loaded.scenarios.length, 4);
});

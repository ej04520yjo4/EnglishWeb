import { localDateKey } from "./local-date.ts";
import {
  gradeConversationAnswer,
  type ConversationData,
  type ConversationResult,
  type ConversationStore,
  type ConversationTurnRecord,
} from "./conversation-practice.ts";

/** Separate storage keeps weak-turn practice out of formal course progress. */
export const CONVERSATION_REVIEW_STORAGE_KEY = "yingju-conversation-review-v1";

export type ConversationWeakTurn = {
  turnId: string;
  reasons: string[];
  studyDate: string;
};

export type ConversationReviewRecord = {
  attempts: number;
  firstCorrect: boolean | null;
  usedHint: boolean;
  answerRevealed: boolean;
  usedPaste: boolean;
  completed: boolean;
};

export type ConversationReviewSession = {
  scenarioId: string;
  sourceRevision: string;
  studyDate: string;
  turnIds: string[];
  turnIndex: number;
  records: Record<string, ConversationReviewRecord>;
  finished: boolean;
};

export type ConversationReviewResult = {
  scenarioId: string;
  sourceRevision: string;
  studyDate: string;
  turnCount: number;
  independentTurns: number;
  assistedTurns: number;
};

export type ConversationReviewStore = {
  schemaVersion: 1;
  sourceRevision: string;
  active: ConversationReviewSession | null;
  lastResult: ConversationReviewResult | null;
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const dateValid = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const emptyRecord = (): ConversationReviewRecord => ({
  attempts: 0,
  firstCorrect: null,
  usedHint: false,
  answerRevealed: false,
  usedPaste: false,
  completed: false,
});

const recordIsWeak = (record: ConversationTurnRecord): string[] => {
  const reasons: string[] = [];
  if (record.attempts > 1) reasons.push("多次作答");
  if (record.firstCorrect === false) reasons.push("第一次未答對");
  if (record.usedHint) reasons.push("使用提示");
  if (record.answerRevealed) reasons.push("看過答案");
  if (record.usedPaste) reasons.push("使用貼上");
  if (record.usedSpeech === true) reasons.push("使用語音轉文字");
  return reasons;
};

const latestTurnHistory = (
  store: ConversationStore,
  sourceRevision: string,
  turnId: string,
): { record: ConversationTurnRecord; studyDate: string } | null => {
  const prefix = `${sourceRevision}:`;
  const suffix = `:${turnId}`;
  let latest: { record: ConversationTurnRecord; studyDate: string } | null = null;
  for (const [key, record] of Object.entries(store.turnHistory)) {
    if (!key.startsWith(prefix) || !key.endsWith(suffix)) continue;
    const remainder = key.slice(prefix.length, key.length - suffix.length);
    if (!dateValid(remainder) || !record || remainder <= (latest?.studyDate ?? "")) continue;
    latest = { record, studyDate: remainder };
  }
  return latest;
};

/**
 * Returns weak turns in the authored scenario order. Only the latest record
 * for this exact conversation source revision is considered; older attempts
 * cannot keep a later clean attempt permanently weak.
 */
export const getConversationWeakTurns = (
  data: ConversationData,
  store: ConversationStore,
  scenarioId: string,
): ConversationWeakTurn[] => {
  if (store.sourceRevision !== data.sourceRevision) return [];
  const scenario = data.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) return [];
  return scenario.turns.flatMap((turn) => {
    const latest = latestTurnHistory(store, data.sourceRevision, turn.id);
    if (!latest) return [];
    const reasons = recordIsWeak(latest.record);
    return reasons.length > 0
      ? [{ turnId: turn.id, reasons, studyDate: latest.studyDate }]
      : [];
  });
};

/** Safely compares valid YYYY-MM-DD dates without relying on local timezones. */
export const isConversationReviewDue = (
  result: ConversationResult | null | undefined,
  today: string,
): boolean => Boolean(
  result &&
  dateValid(result.studyDate) &&
  dateValid(result.dueDate) &&
  dateValid(today) &&
  result.dueDate <= today,
);

const scenarioFor = (data: ConversationData, scenarioId: string) => {
  const scenario = data.scenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) throw new Error(`對話複習 ${scenarioId}：情境不存在。`);
  return scenario;
};

const orderedTurnIds = (
  data: ConversationData,
  scenarioId: string,
  weakTurns: ConversationWeakTurn[],
): string[] => {
  const scenario = scenarioFor(data, scenarioId);
  const requested = new Set<string>();
  for (const weakTurn of weakTurns) {
    if (!object(weakTurn) || !text(weakTurn.turnId)) {
      throw new Error(`對話複習 ${scenarioId}：弱點回合 ID 無效。`);
    }
    const turnId = weakTurn.turnId;
    if (requested.has(turnId)) throw new Error(`對話複習 ${scenarioId}：弱點回合重複。`);
    requested.add(turnId);
  }
  const known = new Set(scenario.turns.map((turn) => turn.id));
  for (const turnId of requested) {
    if (!known.has(turnId)) throw new Error(`對話複習 ${scenarioId} / ${turnId}：回合不存在。`);
  }
  const turnIds = scenario.turns
    .map((turn) => turn.id)
    .filter((turnId) => requested.has(turnId));
  if (!turnIds.length) throw new Error(`對話複習 ${scenarioId}：目前沒有需要加強的回合。`);
  return turnIds;
};

const reviewRecordValid = (value: unknown): value is ConversationReviewRecord => {
  if (!object(value)) return false;
  const attempts = value.attempts;
  const firstCorrect = value.firstCorrect;
  if (typeof attempts !== "number" || !Number.isSafeInteger(attempts) || attempts < 0) return false;
  if (![true, false, null].includes(firstCorrect as boolean | null)) return false;
  if (["usedHint", "answerRevealed", "usedPaste", "completed"].some((key) => typeof value[key] !== "boolean")) return false;
  if ((attempts === 0) !== (firstCorrect === null)) return false;
  if (value.completed === true && attempts === 0) return false;
  if (firstCorrect === true && value.completed !== true) return false;
  if (value.answerRevealed === true && attempts < 3) return false;
  if (value.completed !== true && attempts >= 3 && value.answerRevealed !== true) return false;
  return true;
};

const reviewSessionValid = (
  data: ConversationData,
  value: unknown,
): value is ConversationReviewSession => {
  if (!object(value) || !text(value.scenarioId) || value.sourceRevision !== data.sourceRevision || !dateValid(value.studyDate) || !Array.isArray(value.turnIds) || !value.turnIds.length || !Number.isInteger(value.turnIndex) || typeof value.finished !== "boolean" || !object(value.records)) return false;
  const turnIds = value.turnIds;
  const turnIndex = value.turnIndex;
  const records = value.records;
  const scenario = data.scenarios.find((candidate) => candidate.id === value.scenarioId);
  if (!scenario || Number(turnIndex) < 0 || Number(turnIndex) >= turnIds.length) return false;
  const known = new Set(scenario.turns.map((turn) => turn.id));
  const indexes = turnIds.map((turnId) => scenario.turns.findIndex((turn) => turn.id === turnId));
  if (turnIds.some((turnId) => typeof turnId !== "string" || !known.has(turnId)) || new Set(turnIds).size !== turnIds.length || indexes.some((index, position) => index < 0 || (position > 0 && index <= indexes[position - 1]))) return false;
  for (const [turnId, record] of Object.entries(records)) {
    if (!turnIds.includes(turnId) || !reviewRecordValid(record)) return false;
  }
  for (let index = 0; index < Number(turnIndex); index += 1) {
    const record = records[turnIds[index]];
    if (!reviewRecordValid(record) || !record.completed) return false;
  }
  for (let index = Number(turnIndex) + 1; index < turnIds.length; index += 1) {
    const record = records[turnIds[index]];
    if (record && (!reviewRecordValid(record) || record.attempts !== 0 || record.firstCorrect !== null || record.usedHint || record.answerRevealed || record.usedPaste || record.completed)) return false;
  }
  const lastRecord = records[turnIds.at(-1)!];
  if (value.finished && (Number(turnIndex) !== turnIds.length - 1 || !reviewRecordValid(lastRecord) || !lastRecord.completed)) return false;
  return true;
};

const currentSession = (data: ConversationData, session: ConversationReviewSession, now: Date): ConversationReviewSession => {
  if (!reviewSessionValid(data, session)) throw new Error("對話複習：保存中的回合或來源版本無效。 ");
  if (session.studyDate !== localDateKey(now)) throw new Error("對話複習日期已變更，請重新開始；既有對話紀錄不受影響。 ");
  if (session.finished) throw new Error("本段對話複習已完成，請返回情境列表。 ");
  return session;
};

export const emptyConversationReviewStore = (data: ConversationData): ConversationReviewStore => ({
  schemaVersion: 1,
  sourceRevision: data.sourceRevision,
  active: null,
  lastResult: null,
});

export const startConversationReview = (
  data: ConversationData,
  scenarioId: string,
  weakTurns: ConversationWeakTurn[],
  today: string,
): ConversationReviewSession => {
  if (!dateValid(today)) throw new Error("對話複習：日期無效，未變更紀錄。 ");
  const turnIds = orderedTurnIds(data, scenarioId, weakTurns);
  const records = Object.fromEntries(turnIds.map((turnId) => [turnId, emptyRecord()]));
  return {
    scenarioId,
    sourceRevision: data.sourceRevision,
    studyDate: today,
    turnIds,
    turnIndex: 0,
    records,
    finished: false,
  };
};

export const currentConversationReviewRecord = (session: ConversationReviewSession): ConversationReviewRecord =>
  session.records[session.turnIds[session.turnIndex]] ?? emptyRecord();

export const markConversationReviewSupport = (
  data: ConversationData,
  session: ConversationReviewSession,
  kind: "hint" | "paste",
  now = new Date(),
): ConversationReviewSession => {
  const valid = currentSession(data, session, now);
  const turnId = valid.turnIds[valid.turnIndex];
  const record = currentConversationReviewRecord(valid);
  if (record.completed) return valid;
  return {
    ...valid,
    records: {
      ...valid.records,
      [turnId]: {
        ...record,
        ...(kind === "hint" ? { usedHint: true } : { usedPaste: true }),
      },
    },
  };
};

export const submitConversationReviewAnswer = (
  data: ConversationData,
  session: ConversationReviewSession,
  answer: string,
  now = new Date(),
): ConversationReviewSession => {
  const valid = currentSession(data, session, now);
  if (!answer.trim()) return valid;
  const scenario = scenarioFor(data, valid.scenarioId);
  const turn = scenario.turns.find((candidate) => candidate.id === valid.turnIds[valid.turnIndex]);
  if (!turn) throw new Error(`對話複習 ${valid.scenarioId}：目前回合不存在。`);
  const previous = currentConversationReviewRecord(valid);
  if (previous.completed) return valid;
  const correct = gradeConversationAnswer(answer, turn);
  const attempts = previous.attempts + 1;
  const record: ConversationReviewRecord = {
    ...previous,
    attempts,
    firstCorrect: previous.firstCorrect ?? correct,
    answerRevealed: previous.answerRevealed || (!correct && attempts >= 3),
    completed: correct,
  };
  return { ...valid, records: { ...valid.records, [turn.id]: record } };
};

export const advanceConversationReview = (
  data: ConversationData,
  session: ConversationReviewSession,
  now = new Date(),
): ConversationReviewSession => {
  const valid = currentSession(data, session, now);
  if (!currentConversationReviewRecord(valid).completed) throw new Error("請先完成目前的弱點回合，再繼續。 ");
  return valid.turnIndex === valid.turnIds.length - 1
    ? { ...valid, finished: true }
    : { ...valid, turnIndex: valid.turnIndex + 1 };
};

const mergeRecords = (
  previous: ConversationReviewRecord | undefined,
  current: ConversationReviewRecord,
): ConversationReviewRecord => previous ? {
  attempts: Math.max(previous.attempts, current.attempts),
  firstCorrect: previous.firstCorrect ?? current.firstCorrect,
  usedHint: previous.usedHint || current.usedHint,
  answerRevealed: previous.answerRevealed || current.answerRevealed,
  usedPaste: previous.usedPaste || current.usedPaste,
  completed: previous.completed || current.completed,
} : { ...current };

const sameSession = (left: ConversationReviewSession | null, right: ConversationReviewSession): boolean =>
  Boolean(left && left.scenarioId === right.scenarioId && left.sourceRevision === right.sourceRevision && left.studyDate === right.studyDate && left.turnIds.length === right.turnIds.length && left.turnIds.every((turnId, index) => turnId === right.turnIds[index]));

const mergedSession = (previous: ConversationReviewSession | null, current: ConversationReviewSession): ConversationReviewSession => {
  if (!previous || !sameSession(previous, current)) return { ...current, records: { ...current.records } };
  const records = Object.fromEntries(current.turnIds.map((turnId) => [turnId, mergeRecords(previous.records[turnId], current.records[turnId] ?? emptyRecord())]));
  return {
    ...current,
    turnIndex: Math.max(previous.turnIndex, current.turnIndex),
    finished: previous.finished || current.finished,
    records,
  };
};

const resultFrom = (session: ConversationReviewSession): ConversationReviewResult => {
  const records = session.turnIds.map((turnId) => session.records[turnId] ?? emptyRecord());
  const independentTurns = records.filter((record) => record.firstCorrect === true && !record.usedHint && !record.usedPaste && !record.answerRevealed).length;
  return {
    scenarioId: session.scenarioId,
    sourceRevision: session.sourceRevision,
    studyDate: session.studyDate,
    turnCount: records.length,
    independentTurns,
    assistedTurns: records.length - independentTurns,
  };
};

export const saveConversationReviewSession = (
  store: ConversationReviewStore,
  data: ConversationData,
  session: ConversationReviewSession,
): ConversationReviewStore => {
  if (store.schemaVersion !== 1 || store.sourceRevision !== data.sourceRevision) throw new Error("對話複習來源已更新，請重新載入後繼續。 ");
  if (!reviewSessionValid(data, session)) throw new Error("對話複習：保存中的回合或來源版本無效。 ");
  const nextSession = mergedSession(store.active, session);
  if (!nextSession.finished) return { ...store, active: nextSession };
  return { ...store, active: null, lastResult: resultFrom(nextSession) };
};

const reviewResultValid = (data: ConversationData, value: unknown): value is ConversationReviewResult => {
  if (!object(value) || !text(value.scenarioId) || value.sourceRevision !== data.sourceRevision || !dateValid(value.studyDate)) return false;
  const turnCount = value.turnCount;
  const independentTurns = value.independentTurns;
  const assistedTurns = value.assistedTurns;
  if (typeof turnCount !== "number" || typeof independentTurns !== "number" || typeof assistedTurns !== "number" || !Number.isSafeInteger(turnCount) || turnCount < 1 || !Number.isSafeInteger(independentTurns) || !Number.isSafeInteger(assistedTurns) || independentTurns < 0 || assistedTurns < 0 || independentTurns + assistedTurns !== turnCount) return false;
  const scenario = data.scenarios.find((candidate) => candidate.id === value.scenarioId);
  return Boolean(scenario && turnCount <= scenario.turns.length);
};

export const restoreConversationReviewStore = (
  raw: string | null,
  data: ConversationData,
  today: string,
): ConversationReviewStore => {
  if (!dateValid(today)) throw new Error("對話複習：目前日期無效。 ");
  if (!raw) return emptyConversationReviewStore(data);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("對話複習紀錄不是有效 JSON。未覆寫原始紀錄。 ");
  }
  if (!object(parsed) || parsed.schemaVersion !== 1 || parsed.sourceRevision !== data.sourceRevision || !(parsed.active === null || object(parsed.active)) || !(parsed.lastResult === null || object(parsed.lastResult))) {
    throw new Error("對話複習紀錄格式或來源版本無效。未覆寫原始紀錄。 ");
  }
  if (parsed.lastResult !== null && !reviewResultValid(data, parsed.lastResult)) throw new Error("對話複習結果無效。未覆寫原始紀錄。 ");
  if (parsed.active !== null && (!reviewSessionValid(data, parsed.active) || parsed.active.finished)) throw new Error("對話複習中的作答回合無效。未覆寫原始紀錄。 ");
  const active = parsed.active === null || (parsed.active as ConversationReviewSession).studyDate !== today
    ? null
    : parsed.active as ConversationReviewSession;
  return {
    schemaVersion: 1,
    sourceRevision: data.sourceRevision,
    active,
    lastResult: parsed.lastResult as ConversationReviewResult | null,
  };
};

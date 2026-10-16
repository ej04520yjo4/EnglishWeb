import type { A1CourseCsvRow } from "./a1-mvp-data.ts";
import { localDateKey } from "./local-date.ts";
import { normalizeSentenceForComparison } from "./curriculum/sentence-words.ts";

export const CONVERSATION_URL = "/data/conversation-practice-v1.json";
export const CONVERSATION_STORAGE_KEY = "yingju-conversation-practice-v1";
export type ConversationTurn = {
  id: string;
  partnerEnglish: string;
  partnerZhTw: string;
  goalZhTw: string;
  hintZhTw: string;
  answers: string[];
  feedbackZhTw: string;
};
export type ConversationScenario = {
  id: string;
  title: string;
  level: "A1" | "A2";
  requiredLessonIds: string[];
  summaryZhTw: string;
  preparation: { english: string; translationZhTw: string; noteZhTw: string }[];
  turns: ConversationTurn[];
};
export type ConversationData = {
  schemaVersion: 1;
  sourceVersion: "conversation-practice-v1";
  sourceRevision: string;
  qaStatus: "pilot_review_required";
  scenarios: ConversationScenario[];
};
export type ConversationTurnRecord = {
  attempts: number;
  firstCorrect: boolean | null;
  usedHint: boolean;
  answerRevealed: boolean;
  usedPaste: boolean;
  repairUsed: boolean;
  completed: boolean;
};
export type ConversationSession = {
  scenarioId: string;
  studyDate: string;
  sourceRevision: string;
  turnIndex: number;
  turns: Record<string, ConversationTurnRecord>;
  finished: boolean;
};
export type ConversationResult = {
  id: string;
  scenarioId: string;
  sourceRevision: string;
  studyDate: string;
  dueDate: string;
  turnCount: number;
  independentTurns: number;
  assistedTurns: number;
};
export type ConversationStore = {
  schemaVersion: 1;
  sourceRevision: string;
  active: ConversationSession | null;
  results: Record<string, ConversationResult>;
  turnHistory: Record<string, ConversationTurnRecord>;
};

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const dateValid = (date: unknown): date is string => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};
const normalized = (value: string) => normalizeSentenceForComparison(value.replace(/[’‘]/g, "'"));

// SHA-256 invalidates active practice when authored content changes; it is not authentication.
export const conversationRevision = async (scenarios: ConversationScenario[]): Promise<string> => {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(scenarios)));
  return `conversation-v1-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
};

export const parseConversationData = async (value: unknown, rows: A1CourseCsvRow[]): Promise<ConversationData> => {
  if (!object(value) || value.schemaVersion !== 1 || value.sourceVersion !== "conversation-practice-v1" || value.qaStatus !== "pilot_review_required" || !Array.isArray(value.scenarios) || !value.scenarios.length) {
    throw new Error("對話練習：來源版本、試行狀態或情境清單不正確。");
  }
  const lessonLevels = new Map(rows.map((row) => [row.lesson_id, row.level]));
  const ids = new Set<string>();
  for (const candidate of value.scenarios) {
    if (!object(candidate) || !text(candidate.id) || !/^conversation-[a-z-]+$/.test(candidate.id) || ids.has(candidate.id)) throw new Error("對話練習：情境 ID 缺少、重複或格式錯誤。");
    ids.add(candidate.id);
    const label = `對話 ${candidate.id}`;
    if (!["A1", "A2"].includes(String(candidate.level)) || !text(candidate.title) || !text(candidate.summaryZhTw)) throw new Error(`${label}：程度、名稱或情境說明缺少。`);
    if (!Array.isArray(candidate.requiredLessonIds) || !candidate.requiredLessonIds.length || candidate.requiredLessonIds.some((id) => typeof id !== "string" || lessonLevels.get(id) !== candidate.level)) throw new Error(`${label}：前置課程不存在或程度不一致。`);
    if (!Array.isArray(candidate.preparation) || candidate.preparation.length < 3 || candidate.preparation.some((phrase) => !object(phrase) || !text(phrase.english) || !text(phrase.translationZhTw) || !text(phrase.noteZhTw))) throw new Error(`${label}：缺少可先學習的雙語句子。`);
    if (!Array.isArray(candidate.turns) || candidate.turns.length < 3 || candidate.turns.length > 6) throw new Error(`${label}：必須有 3～6 個來回作答。`);
    const taught = new Set((candidate.preparation as ConversationScenario["preparation"]).map((phrase) => normalized(phrase.english)));
    for (const [index, turn] of candidate.turns.entries()) {
      if (!object(turn) || turn.id !== `${candidate.id}-turn-${index + 1}` || ids.has(String(turn.id))) throw new Error(`${label}：第 ${index + 1} 輪 ID／順序不正確。`);
      ids.add(String(turn.id));
      for (const field of ["partnerEnglish", "partnerZhTw", "goalZhTw", "hintZhTw", "feedbackZhTw"]) {
        if (!text(turn[field])) throw new Error(`${label} / ${turn.id}：缺少 ${field}。`);
      }
      if (!taught.has(normalized(String(turn.partnerEnglish)))) throw new Error(`${label} / ${turn.id}：對方的說法也必須有雙語預習。`);
      if (!Array.isArray(turn.answers) || !turn.answers.length || turn.answers.some((answer) => !text(answer) || !taught.has(normalized(answer)))) throw new Error(`${label} / ${turn.id}：每個參考回應都必須先有雙語教學，不可突然要求未教說法。`);
      if (new Set(turn.answers.map((answer) => normalized(String(answer)))).size !== turn.answers.length) throw new Error(`${label} / ${turn.id}：參考回應重複。`);
    }
  }
  const data = value as ConversationData;
  if (data.sourceRevision !== await conversationRevision(data.scenarios)) throw new Error("對話練習：內容版本與指紋不符，請更新來源後重試。");
  return data;
};

export const loadConversationData = async (rows: A1CourseCsvRow[], fetcher: typeof fetch = fetch): Promise<ConversationData> => {
  const response = await fetcher(CONVERSATION_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`對話練習載入失敗（HTTP ${response.status}）；原有課程仍可使用。`);
  return parseConversationData(await response.json(), rows);
};
export const canStartConversation = (scenario: ConversationScenario, completedIds: string[], a2Unlocked: boolean, preview: boolean): boolean =>
  preview || ((scenario.level === "A1" || a2Unlocked) && scenario.requiredLessonIds.every((id) => completedIds.includes(id)));

const emptyRecord = (): ConversationTurnRecord => ({ attempts: 0, firstCorrect: null, usedHint: false, answerRevealed: false, usedPaste: false, repairUsed: false, completed: false });
export const getConversationTurnRecord = (session: ConversationSession): ConversationTurnRecord =>
  session.turns[`${session.scenarioId}-turn-${session.turnIndex + 1}`] ?? emptyRecord();
export const emptyConversationStore = (data: ConversationData): ConversationStore => ({ schemaVersion: 1, sourceRevision: data.sourceRevision, active: null, results: {}, turnHistory: {} });
export const startConversation = (data: ConversationData, scenarioId: string, today: string): ConversationSession => {
  if (!dateValid(today) || !data.scenarios.some((scenario) => scenario.id === scenarioId)) throw new Error("對話練習：日期或情境不存在，未變更紀錄。");
  return { scenarioId, studyDate: today, sourceRevision: data.sourceRevision, turnIndex: 0, turns: {}, finished: false };
};
const validRecord = (value: unknown): value is ConversationTurnRecord => {
  if (!object(value) || !Number.isSafeInteger(value.attempts) || Number(value.attempts) < 0 || ![true, false, null].includes(value.firstCorrect as boolean | null)) return false;
  if (["usedHint", "answerRevealed", "usedPaste", "repairUsed", "completed"].some((key) => typeof value[key] !== "boolean")) return false;
  if ((value.attempts === 0) !== (value.firstCorrect === null) || (value.completed && Number(value.attempts) === 0) || (value.answerRevealed && Number(value.attempts) < 3)) return false;
  return true;
};
const validateSession = (data: ConversationData, value: unknown): ConversationSession => {
  if (!object(value) || value.sourceRevision !== data.sourceRevision || !dateValid(value.studyDate) || !Number.isInteger(value.turnIndex) || typeof value.finished !== "boolean" || !object(value.turns)) throw new Error("對話練習：保存中的作答格式或來源版本無效。");
  const scenario = data.scenarios.find((entry) => entry.id === value.scenarioId);
  if (!scenario || Number(value.turnIndex) < 0 || Number(value.turnIndex) >= scenario.turns.length) throw new Error("對話練習：保存中的情境或輪次不存在。");
  for (const [id, record] of Object.entries(value.turns)) {
    const index = scenario.turns.findIndex((turn) => turn.id === id);
    if (index < 0 || index > Number(value.turnIndex) || !validRecord(record)) throw new Error(`對話 ${scenario.id} / ${id}：作答紀錄無效。`);
  }
  for (let index = 0; index < Number(value.turnIndex); index++) {
    if (!(value.turns[scenario.turns[index].id] as ConversationTurnRecord | undefined)?.completed) throw new Error(`對話 ${scenario.id}：不可跳過未完成輪次。`);
  }
  if (value.finished && (Number(value.turnIndex) !== scenario.turns.length - 1 || !(value.turns[scenario.turns.at(-1)!.id] as ConversationTurnRecord | undefined)?.completed)) throw new Error(`對話 ${scenario.id}：完成狀態不正確。`);
  return value as ConversationSession;
};
const currentSession = (data: ConversationData, session: ConversationSession, now: Date) => {
  const valid = validateSession(data, session);
  if (valid.studyDate !== localDateKey(now)) throw new Error("對話日期已變更，請返回情境清單重新開始；既有課程進度不受影響。");
  if (valid.finished) throw new Error("本段對話已完成，請返回情境清單。");
  return valid;
};
export const gradeConversationAnswer = (answer: string, turn: ConversationTurn): boolean =>
  turn.answers.some((reference) => normalized(answer) === normalized(reference));
export const markConversationSupport = (data: ConversationData, session: ConversationSession, kind: "hint" | "paste" | "repair", now = new Date()): ConversationSession => {
  currentSession(data, session, now);
  const record = getConversationTurnRecord(session);
  if (record.completed) return session;
  const field = kind === "hint" ? "usedHint" : kind === "paste" ? "usedPaste" : "repairUsed";
  return { ...session, turns: { ...session.turns, [`${session.scenarioId}-turn-${session.turnIndex + 1}`]: { ...record, [field]: true } } };
};
export const submitConversationAnswer = (data: ConversationData, session: ConversationSession, answer: string, now = new Date()): ConversationSession => {
  currentSession(data, session, now);
  if (!answer.trim()) return session;
  const scenario = data.scenarios.find((entry) => entry.id === session.scenarioId)!;
  const turn = scenario.turns[session.turnIndex];
  const previous = getConversationTurnRecord(session);
  if (previous.completed) return session;
  const correct = gradeConversationAnswer(answer, turn);
  const attempts = previous.attempts + 1;
  const record = { ...previous, attempts, firstCorrect: previous.firstCorrect ?? correct, answerRevealed: previous.answerRevealed || (!correct && attempts >= 3), completed: correct };
  return { ...session, turns: { ...session.turns, [turn.id]: record } };
};
export const advanceConversation = (data: ConversationData, session: ConversationSession, now = new Date()): ConversationSession => {
  currentSession(data, session, now);
  if (!getConversationTurnRecord(session).completed) throw new Error("請先完成目前的回應，再進入下一輪對話。");
  const scenario = data.scenarios.find((entry) => entry.id === session.scenarioId)!;
  return session.turnIndex === scenario.turns.length - 1 ? { ...session, finished: true } : { ...session, turnIndex: session.turnIndex + 1 };
};
const dateAfter = (date: string, days: number) => {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};
export const conversationResultId = (scenarioId: string, studyDate: string, sourceRevision: string): string =>
  `${scenarioId}:${studyDate}:${sourceRevision}`;
export const saveConversationSession = (store: ConversationStore, data: ConversationData, session: ConversationSession): ConversationStore => {
  validateSession(data, session);
  if (store.sourceRevision !== data.sourceRevision) throw new Error("對話來源已更新，請重新載入後繼續。");
  const turnHistory = { ...store.turnHistory };
  for (const [turnId, record] of Object.entries(session.turns)) {
    const key = `${session.sourceRevision}:${session.studyDate}:${turnId}`;
    const previous = turnHistory[key];
    turnHistory[key] = previous ? {
      attempts: Math.max(previous.attempts, record.attempts),
      firstCorrect: previous.firstCorrect ?? record.firstCorrect,
      usedHint: previous.usedHint || record.usedHint,
      answerRevealed: previous.answerRevealed || record.answerRevealed,
      usedPaste: previous.usedPaste || record.usedPaste,
      repairUsed: previous.repairUsed || record.repairUsed,
      completed: previous.completed || record.completed,
    } : record;
  }
  if (!session.finished) return { ...store, active: session, turnHistory };
  const id = conversationResultId(session.scenarioId, session.studyDate, session.sourceRevision);
  if (store.results[id]) return { ...store, active: null, turnHistory }; // First completion of this source/local date remains authoritative.
  const records = Object.keys(session.turns).map((turnId) => turnHistory[`${session.sourceRevision}:${session.studyDate}:${turnId}`]);
  const independentTurns = records.filter((record) => record.firstCorrect && !record.usedHint && !record.usedPaste && !record.answerRevealed).length;
  const result: ConversationResult = { id, scenarioId: session.scenarioId, sourceRevision: data.sourceRevision, studyDate: session.studyDate, dueDate: dateAfter(session.studyDate, independentTurns === records.length ? 3 : 1), turnCount: records.length, independentTurns, assistedTurns: records.length - independentTurns };
  return { ...store, active: null, turnHistory, results: { ...store.results, [id]: result } };
};
export const restoreConversationStore = (raw: string | null, data: ConversationData, today: string): ConversationStore => {
  if (!dateValid(today)) throw new Error("對話練習：目前日期無效。");
  if (!raw) return emptyConversationStore(data);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("對話紀錄不是有效 JSON。未覆寫原始紀錄，請先備份再重設對話紀錄。"); }
  if (!object(parsed) || parsed.schemaVersion !== 1 || typeof parsed.sourceRevision !== "string" || !object(parsed.results) || !object(parsed.turnHistory)) throw new Error("對話紀錄格式無效。未覆寫原始紀錄，正式課程仍可使用。");
  for (const [id, record] of Object.entries(parsed.turnHistory)) {
    if (!/^conversation-v1-(?:[a-f0-9]{8}|[a-f0-9]{64}):\d{4}-\d{2}-\d{2}:conversation-[a-z-]+-turn-\d+$/.test(id) || !validRecord(record)) throw new Error(`對話紀錄 ${id}：首次作答格式無效。`);
  }
  for (const [id, result] of Object.entries(parsed.results)) {
    if (!object(result) || result.id !== id || !text(result.scenarioId) || !text(result.sourceRevision) || !dateValid(result.studyDate) || !dateValid(result.dueDate) || !Number.isInteger(result.turnCount) || Number(result.turnCount) < 3 || Number(result.turnCount) > 6 || !Number.isInteger(result.independentTurns) || !Number.isInteger(result.assistedTurns) || Number(result.independentTurns) < 0 || Number(result.assistedTurns) < 0 || Number(result.independentTurns) + Number(result.assistedTurns) !== result.turnCount || result.dueDate !== dateAfter(result.studyDate, result.independentTurns === result.turnCount ? 3 : 1)) throw new Error(`對話紀錄 ${id} 無效，未覆寫原始資料。`);
    const currentId = conversationResultId(result.scenarioId, result.studyDate, result.sourceRevision);
    const historicalId = `${result.scenarioId}:${result.studyDate}`;
    if (id !== currentId && !(id === historicalId && result.sourceRevision !== data.sourceRevision)) throw new Error(`對話紀錄 ${id}：來源與紀錄 ID 不符。`);
    if (result.sourceRevision === data.sourceRevision) {
      const scenario = data.scenarios.find((entry) => entry.id === result.scenarioId);
      if (!scenario || scenario.turns.length !== result.turnCount) throw new Error(`對話紀錄 ${id}：本版情境不存在或回合數不符，未覆寫原始資料。`);
    }
  }
  // Old-version results remain historical, but only same-source/current-day activity resumes.
  let active: ConversationSession | null = null;
  if (parsed.sourceRevision === data.sourceRevision && parsed.active !== null) {
    const session = validateSession(data, parsed.active);
    if (session.studyDate === today && !session.finished) active = session;
  }
  return { schemaVersion: 1, sourceRevision: data.sourceRevision, active, results: parsed.results as Record<string, ConversationResult>, turnHistory: parsed.turnHistory as Record<string, ConversationTurnRecord> };
};

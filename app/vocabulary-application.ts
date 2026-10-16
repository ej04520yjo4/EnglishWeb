import { localDateKey } from "./local-date.ts";
import { normalizeSentenceForComparison, sentenceSpellingUnits } from "./curriculum/sentence-words.ts";
import { canonicalizeLexemeId, type VocabularyTargetsData, type VocabularyTargetLevel } from "./vocabulary-targets.ts";
import { canCreditApplicationCorrect, normalizeVocabularyEvidence, recordGlobalVocabularyEvidence, type GlobalVocabularyProgress } from "./vocabulary-progress.ts";

export const VOCABULARY_APPLICATION_URL = "/data/vocabulary-applications-v1.json";

export type VocabularyApplicationEntry = {
  id: string;
  lexemeId: string;
  sentence: string;
  translationZhTw: string;
  targetForm: string;
  noteZhTw: string;
  qaStatus: "pilot_review_required";
  sourceType: "original_content";
  sourceRef: string;
};

export type VocabularyApplicationData = {
  schemaVersion: 1;
  sourceVersion: "vocabulary-applications-v1";
  sourceRevision: string;
  coverage: "partial" | "complete";
  targetCount: number;
  license: "CC-BY-SA-4.0";
  attribution: string;
  entries: VocabularyApplicationEntry[];
};

export type VocabularyApplicationQuestion = {
  id: string;
  exerciseId: string;
  lexemeId: string;
  mode: "application";
  studyDate: string;
  sourceLevel: VocabularyTargetLevel;
  sourceRevision: string;
  promptZhTw: string;
  targetForm: string;
  noteZhTw: string;
  wordCount: number;
};

const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const irregularForms: Record<string, string[]> = {
  be: ["am", "is", "are", "was", "were", "been", "being"], have: ["has", "had"], do: ["does", "did", "done"],
  go: ["goes", "went", "gone"], get: ["got", "gotten", "getting"], eat: ["ate", "eaten"], see: ["saw", "seen"],
  take: ["took", "taken"], give: ["gave", "given"], make: ["made"], say: ["said"], buy: ["bought"], bring: ["brought"],
  leave: ["left"], find: ["found"], think: ["thought"], know: ["knew", "known"], write: ["wrote", "written"],
  meet: ["met"], feel: ["felt"], keep: ["kept"], tell: ["told"], speak: ["spoke", "spoken"], sleep: ["slept"],
  run: ["ran", "running"], sit: ["sat", "sitting"], stand: ["stood"], pay: ["paid"], send: ["sent"], build: ["built"],
  wear: ["wore", "worn"], break: ["broke", "broken"], drive: ["drove", "driven"], ride: ["rode", "ridden"],
  choose: ["chose", "chosen"], hold: ["held"], lose: ["lost"], win: ["won"], hear: ["heard"], teach: ["taught"],
  catch: ["caught"], understand: ["understood"], fall: ["fell", "fallen"], grow: ["grew", "grown"],
  overcome: ["overcame"], dig: ["dug", "digging"], undergo: ["underwent", "undergone"],
  swear: ["swore", "sworn"],
  child: ["children"], person: ["people"], man: ["men"], woman: ["women"], foot: ["feet"], tooth: ["teeth"], mouse: ["mice"],
  good: ["better", "best"], bad: ["worse", "worst"], little: ["less", "least"], far: ["farther", "further", "farthest", "furthest"],
};

export const targetFormMatchesLexeme = (lexeme: string, form: string) => {
  const lemma = canonicalizeLexemeId(lexeme);
  const answer = canonicalizeLexemeId(form);
  const forms = new Set([lemma, `${lemma}s`, `${lemma}es`, `${lemma}ed`, `${lemma}ing`, `${lemma}er`, `${lemma}est`, ...(irregularForms[lemma] ?? [])]);
  if (lemma.endsWith("e")) ["d", "r", "st"].forEach((ending) => forms.add(`${lemma}${ending}`));
  if (lemma.endsWith("e")) forms.add(`${lemma.slice(0, -1)}ing`);
  if (/[^aeiou]y$/.test(lemma)) ["ies", "ied", "ier", "iest"].forEach((ending) => forms.add(`${lemma.slice(0, -1)}${ending}`));
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(lemma)) ["ed", "ing", "er", "est"].forEach((ending) => forms.add(`${lemma}${lemma.at(-1)}${ending}`));
  return forms.has(answer);
};

const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const validateVocabularyApplications = (value: unknown, targets: VocabularyTargetsData) => {
  const errors: string[] = [];
  if (!object(value) || !Array.isArray(value.entries)) return { valid: false, errors: ["3000 字句子應用：資料格式不是合法物件／題目清單。"] };
  if (value.schemaVersion !== 1 || value.sourceVersion !== "vocabulary-applications-v1") errors.push("句子應用：來源版本不正確。");
  if (typeof value.sourceRevision !== "string" || !/^[a-f0-9]{64}$/.test(value.sourceRevision)) errors.push("句子應用：缺少合法來源內容雜湊。");
  if (value.targetCount !== targets.entries.length) errors.push("句子應用：目標字數與正式詞彙目標不一致。");
  if (value.license !== "CC-BY-SA-4.0" || !text(value.attribution)) errors.push("句子應用：缺少原創來源授權與作者說明。");
  if (value.coverage !== "partial" && value.coverage !== "complete") errors.push("句子應用：覆蓋狀態不正確。");
  const targetIds = new Set(targets.entries.map((entry) => entry.lexemeId));
  const seenIds = new Set<string>();
  const seenWords = new Set<string>();
  for (const [index, entry] of value.entries.entries()) {
    const label = `句子應用第 ${index + 1} 筆`;
    if (!object(entry)) { errors.push(`${label}：格式不正確。`); continue; }
    if (!text(entry.lexemeId) || !targetIds.has(entry.lexemeId)) errors.push(`${label}：lexemeId ${String(entry.lexemeId)} 不在 3000 字目標。`);
    if (!text(entry.id) || entry.id !== `vocab-application:${entry.lexemeId}:01` || seenIds.has(entry.id)) errors.push(`${label}：題目 ID 不正確或重複。`);
    if (typeof entry.id === "string") seenIds.add(entry.id);
    if (typeof entry.lexemeId === "string") {
      if (seenWords.has(entry.lexemeId)) errors.push(`${label}：${entry.lexemeId} 重複。`);
      seenWords.add(entry.lexemeId);
    }
    if (!text(entry.sentence) || !/^[A-Za-z\s'’‘.,!?;:\-–—]+$/.test(entry.sentence)) {
      errors.push(`${label} (${entry.lexemeId})：英文句子空白或含不支援的字元。`);
    } else {
      const words = sentenceSpellingUnits(entry.sentence);
      if (words.length < 3 || words.length > 24 || !/[.!?]$/.test(entry.sentence)) errors.push(`${label} (${entry.lexemeId})：必須是 3～24 字、有結尾標點的完整句子。`);
      if (!text(entry.targetForm) || !words.some((word) => canonicalizeLexemeId(word) === canonicalizeLexemeId(String(entry.targetForm)))) errors.push(`${label} (${entry.lexemeId})：句子沒有完整的 targetForm。`);
      if (/\b(the word|word means|word is spelled|vocabulary word|example of the word)\b/i.test(entry.sentence)) errors.push(`${label} (${entry.lexemeId})：不可用字典或拼寫描述充當情境應用。`);
    }
    if (!text(entry.translationZhTw) || !/\p{Script=Han}/u.test(entry.translationZhTw)) errors.push(`${label} (${entry.lexemeId})：缺少完整繁中翻譯。`);
    if (!text(entry.noteZhTw)) errors.push(`${label} (${entry.lexemeId})：缺少句中用法說明。`);
    if (text(entry.lexemeId) && text(entry.targetForm) && !targetFormMatchesLexeme(entry.lexemeId, entry.targetForm)) errors.push(`${label} (${entry.lexemeId})：targetForm 不是目標原形或支援的變化形式。`);
    if (!text(entry.sourceRef) || !/^data-sources\/vocabulary-3000\/applications\/batch-\d{3}\.json#/.test(entry.sourceRef)) errors.push(`${label} (${entry.lexemeId})：缺少穩定原創來源。`);
    if (entry.sourceType !== "original_content" || entry.qaStatus !== "pilot_review_required") errors.push(`${label} (${entry.lexemeId})：不可假冒外部來源或人工審核完成。`);
  }
  if (value.coverage === "complete" && seenWords.size !== targetIds.size) errors.push("句子應用：聲稱完整，但仍有目標單字缺題。");
  if (value.coverage === "partial" && seenWords.size >= targetIds.size) errors.push("句子應用：數量完整時請明確更新覆蓋狀態，但不可升級人工 QA。");
  return { valid: errors.length === 0, errors };
};

export const parseVocabularyApplications = (value: unknown, targets: VocabularyTargetsData): VocabularyApplicationData => {
  const report = validateVocabularyApplications(value, targets);
  if (!report.valid) throw new Error(report.errors.join("\n"));
  return value as VocabularyApplicationData;
};

export const loadVocabularyApplications = async (targets: VocabularyTargetsData, fetcher: typeof fetch = fetch) => {
  const response = await fetcher(VOCABULARY_APPLICATION_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`3000 字句子應用載入失敗（HTTP ${response.status}）。辨認與拼字仍可使用。`);
  return parseVocabularyApplications(await response.json(), targets);
};

export const buildVocabularyApplicationQuestion = (data: VocabularyApplicationData, targets: VocabularyTargetsData, lexemeId: string, studyDate: string): VocabularyApplicationQuestion | undefined => {
  if (!validDate(studyDate)) throw new Error("句子應用日期不存在，請重新開始。");
  if (!validateVocabularyApplications(data, targets).valid) return undefined;
  const entry = data.entries.find((item) => item.lexemeId === lexemeId);
  const target = targets.entries.find((item) => item.lexemeId === lexemeId);
  if (!entry || !target) return undefined;
  return {
    id: `vocabulary-library:${studyDate}:application:${lexemeId}`,
    exerciseId: entry.id,
    lexemeId,
    mode: "application",
    studyDate,
    sourceLevel: target.targetLevel,
    sourceRevision: data.sourceRevision,
    promptZhTw: entry.translationZhTw,
    targetForm: entry.targetForm,
    noteZhTw: entry.noteZhTw,
    wordCount: sentenceSpellingUnits(entry.sentence).length,
  };
};

export const gradeVocabularyApplication = (answer: string, expected: string) =>
  normalizeSentenceForComparison(answer) === normalizeSentenceForComparison(expected);

export const recordVocabularyApplicationResult = (
  progress: GlobalVocabularyProgress,
  data: VocabularyApplicationData,
  targets: VocabularyTargetsData,
  question: VocabularyApplicationQuestion,
  answer: string,
  options: { studiedAt?: string; usedPaste?: boolean; answerRevealed?: boolean } = {},
): GlobalVocabularyProgress => {
  if (!object(question) || question.mode !== "application" || typeof answer !== "string") throw new Error("句子應用題目或答案格式不正確，未變更進度。");
  const rebuilt = buildVocabularyApplicationQuestion(data, targets, question.lexemeId, question.studyDate);
  if (!rebuilt || Object.keys(rebuilt).some((key) => rebuilt[key as keyof VocabularyApplicationQuestion] !== question[key as keyof VocabularyApplicationQuestion]) || "answer" in question || "sentence" in question) throw new Error("句子應用題目與來源不一致，未變更進度。");
  const studiedAt = options.studiedAt ?? new Date().toISOString();
  if (typeof studiedAt !== "string" || !validDate(studiedAt.slice(0, 10))) throw new Error("句子應用作答時間格式不正確，未變更進度。");
  const date = new Date(studiedAt);
  if (!Number.isFinite(date.getTime()) || localDateKey(date) !== question.studyDate) throw new Error("句子應用日期已變更，請重新開始；未變更進度。");
  const current = normalizeVocabularyEvidence(progress[question.lexemeId]);
  if (current.applicationAttemptEvidenceIds.includes(question.id)) return progress;
  const entry = data.entries.find((item) => item.id === question.exerciseId);
  if (!entry) throw new Error("句子應用來源已不存在，未變更進度。");
  const evidence = { lexemeIds: [question.lexemeId], evidenceId: question.id, studiedAt, studyDate: question.studyDate, sourceLevel: question.sourceLevel };
  let next = recordGlobalVocabularyEvidence(progress, { ...evidence, kind: "applicationAttempt" });
  if (canCreditApplicationCorrect({ correct: gradeVocabularyApplication(answer, entry.sentence), usedPaste: options.usedPaste ?? false, answerRevealed: options.answerRevealed ?? false })) {
    next = recordGlobalVocabularyEvidence(next, { ...evidence, kind: "applicationCorrect" });
  }
  return next;
};

import type { AudioStatus } from "./course-data.ts";
import { localDateKey } from "./local-date.ts";
import {
  deriveVocabularyMasteryState,
  normalizeVocabularyEvidence,
  recordGlobalVocabularyEvidence,
  type GlobalVocabularyProgress,
} from "./vocabulary-progress.ts";
import {
  canonicalizeLexemeId,
  isSingleLexemeWord,
  type VocabularyMasteryTarget,
  type VocabularyTargetEntry,
  type VocabularyTargetLevel,
  type VocabularyTargetSourceRef,
  type VocabularyTargetsData,
} from "./vocabulary-targets.ts";

export const VOCABULARY_LIBRARY_SOURCE_VERSION = "vocabulary-library-v1";
export const VOCABULARY_LIBRARY_URL = "/data/vocabulary-library-v1.json";
export const VOCABULARY_LIBRARY_PAGE_SIZE = 50;
export const VOCABULARY_LIBRARY_PRACTICE_LIMIT = 5;
export const VOCABULARY_LIBRARY_QA_STATUS = "pilot_review_required";
const LIBRARY_QA_STATUS = VOCABULARY_LIBRARY_QA_STATUS;
const STUDY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type VocabularyLibraryEntry = {
  lexemeId: string;
  displayEnglish: string;
  translationZhTw: string;
  partOfSpeech: string;
  definitionEn: string;
  usageNoteZhTw: string;
  sourceRefs: VocabularyTargetSourceRef[];
  qaStatus: string;
  phoneticStatus: "pending" | "reviewed";
  audioStatus: AudioStatus;
  batchId: string;
  sourceSenseId?: string;
  wordnetSynsetId?: string;
  meaningVariants?: string[];
  wordnetSynsetIds?: string[];
};

export type VocabularyLibraryData = {
  schemaVersion: 1;
  sourceVersion: typeof VOCABULARY_LIBRARY_SOURCE_VERSION;
  entries: VocabularyLibraryEntry[];
};

export type VocabularyLibraryValidationReport = {
  valid: boolean;
  errors: string[];
};

export type ResolvedVocabularyLibraryEntry = {
  entry: VocabularyLibraryEntry;
  target: VocabularyTargetEntry;
};

export type VocabularyLibrarySearchFilters = {
  targetLevel?: VocabularyTargetLevel;
  masteryTarget?: VocabularyMasteryTarget;
  qaStatus?: string;
};

export type VocabularyLibraryPage = {
  entries: ResolvedVocabularyLibraryEntry[];
  query: string;
  page: number;
  pageSize: number;
  totalEntries: number;
  totalPages: number;
};

export type VocabularyPracticeMode = "recognition" | "spelling";

type VocabularyPracticeQuestionCommon = {
  id: string;
  lexemeId: string;
  studyDate: string;
  mode: VocabularyPracticeMode;
  sourceLevel: VocabularyTargetLevel;
  qaStatus: string;
  batchId: string;
};

export type VocabularyRecognitionQuestion =
  VocabularyPracticeQuestionCommon & {
    mode: "recognition";
    displayEnglish: string;
    definitionEn: string;
    promptZhTw: string;
    answer: string;
    options: string[];
  };

export type VocabularySpellingQuestion =
  VocabularyPracticeQuestionCommon & {
    mode: "spelling";
    promptZhTw: string;
    definitionEn: string;
  };

export type VocabularyPracticeQuestion =
  | VocabularyRecognitionQuestion
  | VocabularySpellingQuestion;

type BuildVocabularyPracticeQueueInput = {
  library: VocabularyLibraryData;
  targets: VocabularyTargetsData;
  progress: GlobalVocabularyProgress;
  studyDate: string;
  mode: VocabularyPracticeMode;
  limit?: number;
};

type RecordVocabularyPracticeResultInput = {
  library: VocabularyLibraryData;
  targets: VocabularyTargetsData;
  question: VocabularyPracticeQuestion;
  selectedAnswer: string;
  studiedAt?: string;
  studyDate?: string;
  usedPaste?: boolean;
  answerRevealed?: boolean;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeOption = (value: string) =>
  value.trim().replace(/\s+/g, " ");

const escapeRegExp = (value: string) =>
  value
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/[-']/g, "\\$&");

/**
 * Project an English definition for a spelling question without leaking the
 * answer.  The answer is replaced only when it is a complete lexeme, so a
 * short word such as "he" does not get hidden inside "the" or "theater".
 * Punctuation in a lexeme (apostrophe or hyphen) is escaped as part of the
 * generated expression.
 */
export const maskSpellingAnswerInDefinition = (
  definitionEn: string,
  answer: string,
) => {
  const normalizedAnswer = answer.trim();
  if (!normalizedAnswer) return definitionEn;
  const escapedAnswer = escapeRegExp(normalizedAnswer);
  const boundary = "[^A-Za-z'’-]";
  const wholeAnswer = new RegExp(
    `(^|${boundary})${escapedAnswer}(?=$|${boundary})`,
    "gi",
  );
  return definitionEn.replace(wholeAnswer, "$1____");
};

const normalizeSearch = (value: string) =>
  normalizeOption(value).toLocaleLowerCase("zh-TW");

const stableHash = (value: string) => {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

const normalizeStudyDate = (value: string) => {
  if (typeof value !== "string") {
    throw new Error(`詞彙練習日期格式不正確：${String(value)}`);
  }
  const normalized = value.trim();
  if (!STUDY_DATE_PATTERN.test(normalized)) {
    throw new Error(`詞彙練習日期格式不正確：${value}`);
  }
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error(`詞彙練習日期不存在：${value}`);
  }
  return normalized;
};

const isValidStudyDate = (value: string) => {
  try {
    normalizeStudyDate(value);
    return true;
  } catch {
    return false;
  }
};

const sourceRefKey = (source: VocabularyTargetSourceRef) =>
  JSON.stringify({
    sourceName: source.sourceName,
    sourceVersion: source.sourceVersion,
    sourceType: source.sourceType,
    license: source.license,
    reference: source.reference,
    artifactSha256: source.artifactSha256 ?? "",
    attribution: source.attribution ?? "",
  });

const sameSourceRefs = (
  left: VocabularyTargetSourceRef[],
  right: VocabularyTargetSourceRef[],
) =>
  left.length === right.length &&
  left.every((source, index) => sourceRefKey(source) === sourceRefKey(right[index]));

const targetIndex = (targets: VocabularyTargetsData) =>
  new Map(targets.entries.map((entry) => [entry.lexemeId, entry]));

const libraryIndex = (library: VocabularyLibraryData) =>
  new Map(library.entries.map((entry) => [entry.lexemeId, entry]));

const targetAndEntry = (
  library: VocabularyLibraryData,
  targets: VocabularyTargetsData,
  lexemeId: string,
) => {
  const canonicalLexemeId = canonicalizeLexemeId(lexemeId);
  const entry = libraryIndex(library).get(canonicalLexemeId);
  const target = targetIndex(targets).get(canonicalLexemeId);
  return entry && target ? { entry, target } : undefined;
};

const translationSemanticParts = (value: string) =>
  [...new Set(
    normalizeOption(value)
      .split(/(?:、|／|\/|或|,|，|;|；|\|)/)
      .map((part) => normalizeSearch(part))
      .filter(Boolean),
  )];

export const translationsShareSemanticPart = (left: string, right: string) => {
  const leftParts = new Set(translationSemanticParts(left));
  return translationSemanticParts(right).some((part) => leftParts.has(part));
};

const sharesWordnetSynset = (
  left: VocabularyLibraryEntry,
  right: VocabularyLibraryEntry,
) => {
  const leftIds = [
    ...(left.wordnetSynsetId ? [left.wordnetSynsetId] : []),
    ...(left.wordnetSynsetIds ?? []),
  ];
  const rightIds = [
    ...(right.wordnetSynsetId ? [right.wordnetSynsetId] : []),
    ...(right.wordnetSynsetIds ?? []),
  ];
  if (!leftIds.length || !rightIds.length) {
    return false;
  }
  const rightIdSet = new Set(rightIds);
  return leftIds.some((id) => rightIdSet.has(id));
};

const semanticPartsForEntry = (entry: VocabularyLibraryEntry) => [
  ...translationSemanticParts(entry.translationZhTw),
  ...(entry.meaningVariants ?? []).flatMap(translationSemanticParts),
];

export const entriesShareSemanticMeaning = (
  left: VocabularyLibraryEntry,
  right: VocabularyLibraryEntry,
) => {
  const rightParts = new Set(semanticPartsForEntry(right));
  return semanticPartsForEntry(left).some((part) => rightParts.has(part));
};

export const validateVocabularyLibrary = (
  value: unknown,
  targets: VocabularyTargetsData,
): VocabularyLibraryValidationReport => {
  const errors: string[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: ["3000 詞彙庫資料必須是物件。"] };
  }
  if (value.schemaVersion !== 1) {
    errors.push("3000 詞彙庫 schemaVersion 必須是 1。");
  }
  if (value.sourceVersion !== VOCABULARY_LIBRARY_SOURCE_VERSION) {
    errors.push(
      `3000 詞彙庫 sourceVersion 必須是 ${VOCABULARY_LIBRARY_SOURCE_VERSION}。`,
    );
  }
  if (!Array.isArray(value.entries)) {
    errors.push("3000 詞彙庫缺少 entries 陣列。");
    return { valid: false, errors };
  }
  if (value.entries.length !== targets.entries.length) {
    errors.push(
      `3000 詞彙庫必須與 target entries 一一對應，目前 ${value.entries.length} / ${targets.entries.length}。`,
    );
  }

  const targetById = targetIndex(targets);
  const ids = new Set<string>();
  (value.entries as unknown[]).forEach((unknownEntry, index) => {
    if (!isObject(unknownEntry)) {
      errors.push(`第 ${index + 1} 筆詞彙庫資料不是物件。`);
      return;
    }
    const entry = unknownEntry as Partial<VocabularyLibraryEntry>;
    const rawLexemeId = entry.lexemeId;
    const lexemeId =
      typeof rawLexemeId === "string" ? canonicalizeLexemeId(rawLexemeId) : "";
    if (!lexemeId || ids.has(lexemeId)) {
      errors.push(`詞彙庫 lexemeId 空白或重複：${entry.lexemeId || "（空白）"}。`);
    }
    ids.add(lexemeId);
    if (typeof rawLexemeId !== "string" || rawLexemeId !== lexemeId) {
      errors.push(`${entry.lexemeId || "（空白）"} 不是 canonical lexemeId。`);
    }
    if (!targetById.has(lexemeId)) {
      errors.push(`詞彙庫 ${lexemeId} 不存在於 target catalog。`);
    } else if (
      !Array.isArray(entry.sourceRefs) ||
      !entry.sourceRefs.every(isObject) ||
      !sameSourceRefs(
        entry.sourceRefs as VocabularyTargetSourceRef[],
        targetById.get(lexemeId)!.sourceRefs,
      )
    ) {
      errors.push(`詞彙庫 ${lexemeId} 的 sourceRefs 與 target catalog 不一致。`);
    }
    if (
      typeof entry.displayEnglish !== "string" ||
      !isSingleLexemeWord(entry.displayEnglish)
    ) {
      errors.push(`${lexemeId || `第 ${index + 1} 筆`} 的 displayEnglish 必須是一個英文單字。`);
    } else if (
      canonicalizeLexemeId(entry.displayEnglish ?? "") !== lexemeId
    ) {
      errors.push(`${lexemeId} 的 displayEnglish 與 lexemeId 不一致。`);
    }
    for (const [field, label] of [
      ["translationZhTw", "繁中意思"],
      ["partOfSpeech", "詞性"],
      ["definitionEn", "英文定義"],
      ["usageNoteZhTw", "用法說明"],
      ["batchId", "批次 ID"],
    ] as const) {
      if (typeof entry[field] !== "string" || !entry[field].trim()) {
        errors.push(`${lexemeId} 缺少${label}。`);
      }
    }
    if (entry.qaStatus !== LIBRARY_QA_STATUS) {
      errors.push(`${lexemeId} 的 qaStatus 必須是 ${LIBRARY_QA_STATUS}。`);
    }
    for (const field of ["sourceSenseId", "wordnetSynsetId"] as const) {
      if (
        entry[field] !== undefined &&
        (typeof entry[field] !== "string" || !entry[field].trim())
      ) {
        errors.push(`${lexemeId} 的 ${field} 必須是非空字串。`);
      }
    }
    if (entry.phoneticStatus !== "pending") {
      errors.push(`${lexemeId} 的 phoneticStatus 必須維持 pending。`);
    }
    if (entry.audioStatus !== "fallback") {
      errors.push(`${lexemeId} 的 audioStatus 必須維持 fallback。`);
    }
    for (const [field, valueToCheck] of [
      ["meaningVariants", entry.meaningVariants],
      ["wordnetSynsetIds", entry.wordnetSynsetIds],
    ] as const) {
      if (
        valueToCheck !== undefined &&
        (!Array.isArray(valueToCheck) ||
          valueToCheck.some(
            (item) => typeof item !== "string" || !item.trim(),
          ))
      ) {
        errors.push(`${lexemeId} 的 ${field} 必須是非空字串陣列。`);
      }
    }
  });

  for (const target of targets.entries) {
    if (!ids.has(target.lexemeId)) {
      errors.push(`target ${target.lexemeId} 缺少詞彙庫資料。`);
    }
  }
  return { valid: errors.length === 0, errors };
};

export const parseVocabularyLibrary = (
  value: unknown,
  targets: VocabularyTargetsData,
): VocabularyLibraryData => {
  const report = validateVocabularyLibrary(value, targets);
  if (!report.valid) {
    throw new Error(`3000 詞彙庫驗證失敗：\n${report.errors.join("\n")}`);
  }
  return value as VocabularyLibraryData;
};

export const loadVocabularyLibrary = async (
  targets: VocabularyTargetsData,
  fetcher: typeof fetch = fetch,
): Promise<VocabularyLibraryData> => {
  const response = await fetcher(VOCABULARY_LIBRARY_URL, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`3000 詞彙庫資料載入失敗（${response.status}）。`);
  }
  return parseVocabularyLibrary(await response.json(), targets);
};

const resolvedEntries = (
  library: VocabularyLibraryData,
  targets: VocabularyTargetsData,
) => {
  const targetsById = targetIndex(targets);
  return library.entries
    .flatMap((entry) => {
      const target = targetsById.get(entry.lexemeId);
      return target ? [{ entry, target }] : [];
    })
    .sort(
      (left, right) =>
        left.target.curriculumPriority - right.target.curriculumPriority ||
        left.entry.lexemeId.localeCompare(right.entry.lexemeId),
    );
};

const searchableValues = (item: ResolvedVocabularyLibraryEntry) => [
  item.entry.lexemeId,
  item.entry.displayEnglish,
  item.entry.translationZhTw,
  item.entry.partOfSpeech,
  item.entry.definitionEn,
  item.entry.usageNoteZhTw,
  item.entry.batchId,
  item.entry.sourceSenseId ?? "",
  item.entry.wordnetSynsetId ?? "",
  ...(item.entry.meaningVariants ?? []),
  ...item.target.topics,
  ...item.entry.sourceRefs.flatMap((source) => [
    source.sourceName,
    source.sourceVersion,
    source.sourceType,
    source.license,
    source.reference,
    source.attribution ?? "",
  ]),
];

export const normalizeVocabularyLibrarySearch = (value: string) =>
  normalizeSearch(value);

export const searchVocabularyLibrary = (
  library: VocabularyLibraryData,
  targets: VocabularyTargetsData,
  query = "",
  filters: VocabularyLibrarySearchFilters = {},
) => {
  const normalizedQuery = normalizeVocabularyLibrarySearch(query);
  const normalizedQaStatus = filters.qaStatus
    ? normalizeSearch(filters.qaStatus)
    : "";
  return resolvedEntries(library, targets).filter(({ entry, target }) => {
    if (filters.targetLevel && target.targetLevel !== filters.targetLevel) {
      return false;
    }
    if (
      filters.masteryTarget &&
      target.masteryTarget !== filters.masteryTarget
    ) {
      return false;
    }
    if (normalizedQaStatus && normalizeSearch(entry.qaStatus) !== normalizedQaStatus) {
      return false;
    }
    if (!normalizedQuery) return true;
    return searchableValues({ entry, target }).some((value) =>
      normalizeVocabularyLibrarySearch(value).includes(normalizedQuery),
    );
  });
};

export const paginateVocabularyLibrary = (
  entries: ResolvedVocabularyLibraryEntry[],
  page = 1,
  pageSize = VOCABULARY_LIBRARY_PAGE_SIZE,
) => {
  const normalizedPageSize = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : VOCABULARY_LIBRARY_PAGE_SIZE;
  const totalPages = Math.ceil(entries.length / normalizedPageSize);
  const normalizedPage = Number.isFinite(page)
    ? Math.max(1, Math.floor(page))
    : 1;
  const currentPage = totalPages
    ? Math.min(normalizedPage, totalPages)
    : 1;
  const start = (currentPage - 1) * normalizedPageSize;
  return {
    entries: entries.slice(start, start + normalizedPageSize),
    page: currentPage,
    pageSize: normalizedPageSize,
    totalEntries: entries.length,
    totalPages,
  };
};

export const buildVocabularyLibraryPage = ({
  library,
  targets,
  query = "",
  filters = {},
  page = 1,
  pageSize = VOCABULARY_LIBRARY_PAGE_SIZE,
}: {
  library: VocabularyLibraryData;
  targets: VocabularyTargetsData;
  query?: string;
  filters?: VocabularyLibrarySearchFilters;
  page?: number;
  pageSize?: number;
}): VocabularyLibraryPage => {
  const matches = searchVocabularyLibrary(library, targets, query, filters);
  return {
    query: normalizeVocabularyLibrarySearch(query),
    ...paginateVocabularyLibrary(matches, page, pageSize),
  };
};

export const buildVocabularyLibraryPracticeId = (
  studyDate: string,
  mode: VocabularyPracticeMode,
  lexemeId: string,
) => `vocabulary-library:${studyDate}:${mode}:${lexemeId}`;

const buildRecognitionOptions = (
  source: ResolvedVocabularyLibraryEntry,
  candidates: ResolvedVocabularyLibraryEntry[],
  id: string,
) => {
  const answer = normalizeOption(source.entry.translationZhTw);
  const distractors = candidates
    .filter((candidate) => candidate.entry.lexemeId !== source.entry.lexemeId)
    .filter(
      (candidate) =>
        !entriesShareSemanticMeaning(source.entry, candidate.entry) &&
        !sharesWordnetSynset(source.entry, candidate.entry),
    )
    .map((candidate) => normalizeOption(candidate.entry.translationZhTw))
    .filter((translation) => translation && translation !== answer)
    .sort((left, right) => {
      const difference =
        stableHash(`${id}:distractor:${left}`) -
        stableHash(`${id}:distractor:${right}`);
      return difference || left.localeCompare(right);
    });
  const uniqueDistractors = [...new Set(distractors)].slice(0, 3);
  if (!answer || uniqueDistractors.length !== 3) return undefined;
  const answerIndex = stableHash(`${id}:answer`) % 4;
  const options: string[] = [];
  let distractorIndex = 0;
  for (let index = 0; index < 4; index += 1) {
    if (index === answerIndex) {
      options.push(answer);
    } else {
      options.push(uniqueDistractors[distractorIndex]);
      distractorIndex += 1;
    }
  }
  return { answer, options };
};

const buildPracticeQuestion = (
  source: ResolvedVocabularyLibraryEntry,
  candidates: ResolvedVocabularyLibraryEntry[],
  studyDate: string,
  mode: VocabularyPracticeMode,
): VocabularyPracticeQuestion | undefined => {
  const id = buildVocabularyLibraryPracticeId(studyDate, mode, source.entry.lexemeId);
  const common = {
    id,
    lexemeId: source.entry.lexemeId,
    studyDate,
    mode,
    sourceLevel: source.target.targetLevel,
    qaStatus: source.entry.qaStatus,
    batchId: source.entry.batchId,
  } as const;
  if (mode === "spelling") {
    return {
      ...common,
      mode,
      promptZhTw: source.entry.translationZhTw,
      definitionEn: maskSpellingAnswerInDefinition(
        source.entry.definitionEn,
        source.entry.displayEnglish,
      ),
    };
  }
  const options = buildRecognitionOptions(source, candidates, id);
  if (!options) return undefined;
  return {
    ...common,
    mode,
    displayEnglish: source.entry.displayEnglish,
    definitionEn: source.entry.definitionEn,
    promptZhTw: "請選出這個英文單字的繁體中文意思。",
    answer: options.answer,
    options: options.options,
  };
};

export type BuildVocabularyLibraryPracticeQuestionInput = {
  library: VocabularyLibraryData;
  targets: VocabularyTargetsData;
  lexemeId: string;
  studyDate: string;
  mode: VocabularyPracticeMode;
};

/**
 * Build the same source-validated question used by the recommendation queue
 * for any catalog card.  The card does not need to be in the first five
 * recommendations, but it still needs three safe, distinct distractors.
 */
export const buildVocabularyLibraryPracticeQuestion = ({
  library,
  targets,
  lexemeId,
  studyDate,
  mode,
}: BuildVocabularyLibraryPracticeQuestionInput): VocabularyPracticeQuestion | undefined => {
  const normalizedDate = normalizeStudyDate(studyDate);
  if (mode !== "recognition" && mode !== "spelling") return undefined;
  const report = validateVocabularyLibrary(library, targets);
  if (!report.valid) return undefined;
  const source = targetAndEntry(library, targets, lexemeId);
  if (!source) return undefined;
  return buildPracticeQuestion(
    source,
    resolvedEntries(library, targets),
    normalizedDate,
    mode,
  );
};

const hasPracticeAttemptOnDate = (
  progress: GlobalVocabularyProgress,
  lexemeId: string,
  studyDate: string,
  mode: VocabularyPracticeMode,
) => {
  const evidence = normalizeVocabularyEvidence(progress[lexemeId]);
  const expectedPrefix = `vocabulary-library:${studyDate}:${mode}:${lexemeId}`;
  return evidence.spellingAttemptEvidenceIds
    .concat(evidence.recognitionAttemptEvidenceIds)
    .some(
      (evidenceId) =>
        evidenceId === expectedPrefix &&
        evidence.evidenceStudyDates[evidenceId] === studyDate,
    );
};

export const buildVocabularyLibraryPracticeQueue = ({
  library,
  targets,
  progress,
  studyDate,
  mode,
  limit = VOCABULARY_LIBRARY_PRACTICE_LIMIT,
}: BuildVocabularyPracticeQueueInput): VocabularyPracticeQuestion[] => {
  const normalizedDate = normalizeStudyDate(studyDate);
  if (mode !== "recognition" && mode !== "spelling") return [];
  const report = validateVocabularyLibrary(library, targets);
  if (!report.valid) return [];
  const normalizedLimit = Number.isFinite(limit)
    ? Math.min(
        VOCABULARY_LIBRARY_PRACTICE_LIMIT,
        Math.max(0, Math.floor(limit)),
      )
    : VOCABULARY_LIBRARY_PRACTICE_LIMIT;
  if (normalizedLimit === 0) return [];
  const allCandidates = resolvedEntries(library, targets);
  const candidates = allCandidates
    .filter(
      ({ entry }) =>
        !hasPracticeAttemptOnDate(
          progress,
          entry.lexemeId,
          normalizedDate,
          mode,
        ),
    )
    .map((item) => ({
      ...item,
      masteryState: deriveVocabularyMasteryState(progress[item.entry.lexemeId]),
    }))
    .sort((left, right) => {
      const stagePriority = {
        unseen: 0,
        exposed: 0,
        receptive: 1,
        active: 1,
      } as const;
      return (
        stagePriority[left.masteryState] - stagePriority[right.masteryState] ||
        left.target.curriculumPriority - right.target.curriculumPriority ||
        left.entry.lexemeId.localeCompare(right.entry.lexemeId)
      );
    });
  const questions: VocabularyPracticeQuestion[] = [];
  for (const source of candidates) {
    if (questions.length >= normalizedLimit) break;
    const question = buildPracticeQuestion(
      source,
      allCandidates,
      normalizedDate,
      mode,
    );
    if (question) questions.push(question);
  }
  return questions;
};

const questionIsWellFormed = (question: VocabularyPracticeQuestion) => {
  if (!isObject(question)) return false;
  if (
    typeof question.lexemeId !== "string" ||
    typeof question.studyDate !== "string" ||
    typeof question.id !== "string" ||
    typeof question.qaStatus !== "string" ||
    typeof question.batchId !== "string" ||
    typeof question.mode !== "string"
  ) {
    return false;
  }
  const canonicalLexemeId = canonicalizeLexemeId(question.lexemeId);
  if (
    !isValidStudyDate(question.studyDate) ||
    !isSingleLexemeWord(canonicalLexemeId) ||
    question.lexemeId !== canonicalLexemeId ||
    question.id !==
      buildVocabularyLibraryPracticeId(
        question.studyDate,
        question.mode,
        canonicalLexemeId,
      ) ||
    (question.mode !== "recognition" && question.mode !== "spelling") ||
    !question.qaStatus.trim() ||
    !question.batchId.trim()
  ) {
    return false;
  }
  if (question.mode === "recognition") {
    if (
      !Array.isArray(question.options) ||
      !question.options.every((option) => typeof option === "string")
    ) {
      return false;
    }
    return (
      typeof question.displayEnglish === "string" &&
      typeof question.definitionEn === "string" &&
      typeof question.promptZhTw === "string" &&
      typeof question.answer === "string" &&
      question.displayEnglish.trim() !== "" &&
      question.definitionEn.trim() !== "" &&
      question.promptZhTw.trim() !== "" &&
      question.options.length === 4 &&
      new Set(question.options.map(normalizeOption)).size === 4 &&
      question.options.every((option) => Boolean(normalizeOption(option))) &&
      question.options.some(
        (option) => normalizeOption(option) === normalizeOption(question.answer),
      )
    );
  }
  if (
    typeof question.promptZhTw !== "string" ||
    typeof question.definitionEn !== "string"
  ) {
    return false;
  }
  return (
    question.promptZhTw.trim() !== "" &&
    question.definitionEn.trim() !== "" &&
    !("answer" in question)
  );
};

const questionMatchesSource = (
  question: VocabularyPracticeQuestion,
  library: VocabularyLibraryData,
  targets: VocabularyTargetsData,
) => {
  const source = targetAndEntry(library, targets, question.lexemeId);
  if (!source) return false;
  const candidates = resolvedEntries(library, targets);
  const rebuilt = buildPracticeQuestion(
    source,
    candidates,
    question.studyDate,
    question.mode,
  );
  if (!rebuilt || !questionIsWellFormed(rebuilt)) return false;
  if (
    question.id !== rebuilt.id ||
    question.lexemeId !== rebuilt.lexemeId ||
    question.studyDate !== rebuilt.studyDate ||
    question.mode !== rebuilt.mode ||
    question.sourceLevel !== rebuilt.sourceLevel ||
    question.qaStatus !== rebuilt.qaStatus ||
    question.batchId !== rebuilt.batchId
  ) {
    return false;
  }
  if (question.mode === "recognition" && rebuilt.mode === "recognition") {
    return (
      question.displayEnglish === rebuilt.displayEnglish &&
      question.definitionEn === rebuilt.definitionEn &&
      question.promptZhTw === rebuilt.promptZhTw &&
      question.answer === rebuilt.answer &&
      JSON.stringify(question.options) === JSON.stringify(rebuilt.options)
    );
  }
  if (question.mode === "spelling" && rebuilt.mode === "spelling") {
    return (
      question.promptZhTw === rebuilt.promptZhTw &&
      question.definitionEn === rebuilt.definitionEn
    );
  }
  return false;
};

export const recordVocabularyLibraryPracticeResult = (
  progress: GlobalVocabularyProgress,
  {
    library,
    targets,
    question,
    selectedAnswer,
    studiedAt = new Date().toISOString(),
    studyDate,
    usedPaste = false,
    answerRevealed = false,
  }: RecordVocabularyPracticeResultInput,
): GlobalVocabularyProgress => {
  const libraryReport = validateVocabularyLibrary(library, targets);
  if (!libraryReport.valid) {
    throw new Error("3000 詞彙庫來源驗證失敗，已拒絕記錄。");
  }
  if (
    !questionIsWellFormed(question) ||
    !questionMatchesSource(question, library, targets)
  ) {
    throw new Error("3000 詞彙練習題目不是合法的來源資料，已拒絕記錄。");
  }
  if (typeof selectedAnswer !== "string") {
    throw new Error("3000 詞彙練習答案格式不正確，已拒絕記錄。");
  }
  if (typeof studiedAt !== "string") {
    throw new Error("3000 詞彙練習作答時間格式不正確，已拒絕記錄。");
  }
  const parsedStudiedAt = new Date(studiedAt);
  if (!Number.isFinite(parsedStudiedAt.getTime())) {
    throw new Error("3000 詞彙練習作答時間格式不正確，已拒絕記錄。");
  }
  const timestampDatePart = /^(\d{4}-\d{2}-\d{2})/.exec(studiedAt)?.[1];
  if (timestampDatePart && !isValidStudyDate(timestampDatePart)) {
    throw new Error("3000 詞彙練習作答日期不存在，已拒絕記錄。");
  }
  const resolvedStudyDate = normalizeStudyDate(
    studyDate ?? question.studyDate,
  );
  if (resolvedStudyDate !== question.studyDate) {
    throw new Error("3000 詞彙練習題目日期已變更，請重新開始。");
  }
  if (localDateKey(parsedStudiedAt) !== resolvedStudyDate) {
    throw new Error("3000 詞彙練習作答不在題目日期，已拒絕記錄。");
  }
  const lexemeId = canonicalizeLexemeId(question.lexemeId);
  const source = targetAndEntry(library, targets, lexemeId);
  if (!source) {
    throw new Error("3000 詞彙練習來源已不存在，已拒絕記錄。");
  }
  const normalizedSelectedAnswer = normalizeOption(selectedAnswer);
  if (
    question.mode === "recognition" &&
    !question.options.some(
      (option) => normalizeOption(option) === normalizedSelectedAnswer,
    )
  ) {
    throw new Error("3000 詞彙辨認答案不在合法選項中，已拒絕記錄。");
  }
  if (
    hasPracticeAttemptOnDate(
      progress,
      lexemeId,
      resolvedStudyDate,
      question.mode,
    )
  ) {
    return progress;
  }
  const evidenceId = question.id;
  let next = recordGlobalVocabularyEvidence(progress, {
    lexemeIds: [lexemeId],
    kind: question.mode === "recognition" ? "recognitionAttempt" : "spellingAttempt",
    evidenceId,
    studiedAt,
    studyDate: resolvedStudyDate,
    sourceLevel: question.sourceLevel,
  });
  const correct =
    question.mode === "recognition"
      ? normalizedSelectedAnswer === normalizeOption(question.answer)
      : canonicalizeLexemeId(selectedAnswer) ===
        canonicalizeLexemeId(source.entry.displayEnglish);
  if (
    correct &&
    (question.mode === "recognition" || (!usedPaste && !answerRevealed))
  ) {
    next = recordGlobalVocabularyEvidence(next, {
      lexemeIds: [lexemeId],
      kind:
        question.mode === "recognition"
          ? "recognitionCorrect"
          : "spellingCorrect",
      evidenceId,
      studiedAt,
      studyDate: resolvedStudyDate,
      sourceLevel: question.sourceLevel,
    });
  }
  return next;
};

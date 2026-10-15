import type {
  ResolvedVocabularyGroup,
  ResolvedVocabularyItem,
  VocabularyDataset,
} from "./vocabulary-groups.ts";
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
  type VocabularyTargetEntry,
  type VocabularyTargetsData,
} from "./vocabulary-targets.ts";

const MAX_REFERENCE_RECOGNITION_QUESTIONS = 5;
const REFERENCE_QA_STATUS = "reference_review_required";
const STUDY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ReferenceRecognitionQuestion = {
  id: string;
  groupId: string;
  lexemeId: string;
  studyDate: string;
  displayEnglish: string;
  answer: string;
  options: string[];
  sourceLevel: "A1" | "A2";
  qaStatus: string;
};

type BuildReferenceRecognitionQueueInput = {
  dataset: VocabularyDataset;
  targets: VocabularyTargetsData;
  progress: GlobalVocabularyProgress;
  groupId: string;
  studyDate: string;
  limit?: number;
};

type RecordReferenceRecognitionResultInput = {
  dataset: VocabularyDataset;
  targets: VocabularyTargetsData;
  question: ReferenceRecognitionQuestion;
  selectedAnswer: string;
  studiedAt?: string;
  studyDate?: string;
};

const normalizeOption = (value: string) =>
  value.trim().replace(/\s+/g, " ");

const stableHash = (value: string) => {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

const normalizedStudyDate = (value: string) => {
  const normalized = value.trim();
  if (!STUDY_DATE_PATTERN.test(normalized)) {
    throw new Error(`辨認練習日期格式不正確：${value}`);
  }
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error(`辨認練習日期不存在：${value}`);
  }
  return normalized;
};

const isValidStudyDate = (value: string) => {
  try {
    normalizedStudyDate(value);
    return true;
  } catch {
    return false;
  }
};

const targetIndexFor = (targets: VocabularyTargetsData) =>
  new Map(
    targets.entries.map((entry) => [
      canonicalizeLexemeId(entry.lexemeId),
      entry,
    ]),
  );

const targetForLexeme = (
  targets: VocabularyTargetsData,
  lexemeId: string,
) => {
  const canonicalLexemeId = canonicalizeLexemeId(lexemeId);
  const matches = targets.entries.filter(
    (entry) => canonicalizeLexemeId(entry.lexemeId) === canonicalLexemeId,
  );
  return matches.length === 1 ? matches[0] : undefined;
};

const targetIsReferenceOnly = (target: VocabularyTargetEntry) =>
  target.masteryTarget === "receptive" &&
  target.sourceRefs.length > 0 &&
  target.sourceRefs.every((source) => source.sourceType === "reference");

const itemIsReferenceOnlyCandidate = (
  item: ResolvedVocabularyItem,
  target: VocabularyTargetEntry | undefined,
) =>
  Boolean(
    target &&
      targetIsReferenceOnly(target) &&
      item.source === "reference" &&
      item.qaStatus.trim().toLowerCase() === REFERENCE_QA_STATUS &&
      item.displayEnglish.trim() &&
      item.translationZhTw.trim() &&
      (target.targetLevel === "A1" || target.targetLevel === "A2"),
  );

const hasRecognitionAttemptOnDate = (
  progress: GlobalVocabularyProgress,
  lexemeId: string,
  studyDate: string,
) => {
  const evidence = normalizeVocabularyEvidence(progress[lexemeId]);
  return evidence.recognitionAttemptEvidenceIds.some(
    (evidenceId) => evidence.evidenceStudyDates[evidenceId] === studyDate,
  );
};

const stableTargetOrder = (
  left: {
    item: ResolvedVocabularyItem;
    target: VocabularyTargetEntry;
    masteryState: ReturnType<typeof deriveVocabularyMasteryState>;
  },
  right: {
    item: ResolvedVocabularyItem;
    target: VocabularyTargetEntry;
    masteryState: ReturnType<typeof deriveVocabularyMasteryState>;
  },
) => {
  const stagePriority = {
    unseen: 0,
    exposed: 0,
    receptive: 1,
    active: 1,
  } as const;
  return (
    stagePriority[left.masteryState] - stagePriority[right.masteryState] ||
    left.target.curriculumPriority - right.target.curriculumPriority ||
    left.item.order - right.item.order ||
    left.item.lexemeId.localeCompare(right.item.lexemeId)
  );
};

export const translationSemanticParts = (value: string) =>
  [...new Set(
    normalizeOption(value)
      .split(/(?:、|／|\/|或|,|，|;|；|\|)/)
      .map((part) => normalizeOption(part).toLocaleLowerCase("zh-TW"))
      .filter(Boolean),
  )];

export const translationsShareSemanticPart = (left: string, right: string) => {
  const leftParts = new Set(translationSemanticParts(left));
  return translationSemanticParts(right).some((part) => leftParts.has(part));
};

const buildQuestionOptions = (
  group: ResolvedVocabularyGroup,
  answerLexemeId: string,
  answer: string,
  seed: string,
) => {
  const normalizedAnswer = normalizeOption(answer);
  if (!normalizedAnswer) return undefined;
  const pool = group.items
    .filter(
      (item) =>
        canonicalizeLexemeId(item.lexemeId) !==
        canonicalizeLexemeId(answerLexemeId),
    )
    .map((item) => normalizeOption(item.translationZhTw))
    .filter(Boolean);

  const distractors = [...new Set(pool)]
    .filter(
      (option) =>
        option !== normalizedAnswer &&
        !translationsShareSemanticPart(normalizedAnswer, option),
    )
    .sort((left, right) => {
      const difference =
        stableHash(`${seed}:distractor:${left}`) -
        stableHash(`${seed}:distractor:${right}`);
      return difference || left.localeCompare(right);
    })
    .slice(0, 3);
  if (distractors.length !== 3) return undefined;

  const answerIndex = stableHash(`${seed}:answer`) % 4;
  const options: string[] = [];
  let distractorIndex = 0;
  for (let index = 0; index < 4; index += 1) {
    if (index === answerIndex) {
      options.push(normalizedAnswer);
    } else {
      options.push(distractors[distractorIndex]);
      distractorIndex += 1;
    }
  }
  return { answer: normalizedAnswer, options };
};

const groupForId = (dataset: VocabularyDataset, groupId: string) =>
  dataset.groups.find((group) => group.id === groupId);

const buildReferenceRecognitionQuestion = ({
  group,
  item,
  target,
  studyDate,
}: {
  group: ResolvedVocabularyGroup;
  item: ResolvedVocabularyItem;
  target: VocabularyTargetEntry;
  studyDate: string;
}): ReferenceRecognitionQuestion | undefined => {
  if (!itemIsReferenceOnlyCandidate(item, target)) return undefined;
  const lexemeId = canonicalizeLexemeId(item.lexemeId);
  if (!isSingleLexemeWord(lexemeId)) return undefined;
  const id = `reference-recognition:${studyDate}:${lexemeId}`;
  const builtOptions = buildQuestionOptions(
    group,
    lexemeId,
    item.translationZhTw,
    id,
  );
  if (!builtOptions) return undefined;
  return {
    id,
    groupId: group.id,
    lexemeId,
    studyDate,
    displayEnglish: item.displayEnglish.trim(),
    answer: builtOptions.answer,
    options: builtOptions.options,
    sourceLevel: target.targetLevel,
    qaStatus: item.qaStatus.trim(),
  };
};

/**
 * Builds a separate recognition-only queue for reference vocabulary.
 * Reference items never become formal course occurrences or review items.
 */
export const buildReferenceRecognitionQueue = ({
  dataset,
  targets,
  progress,
  groupId,
  studyDate,
  limit = MAX_REFERENCE_RECOGNITION_QUESTIONS,
}: BuildReferenceRecognitionQueueInput): ReferenceRecognitionQuestion[] => {
  const normalizedDate = normalizedStudyDate(studyDate);
  const normalizedLimit = Number.isFinite(limit)
    ? Math.min(
        MAX_REFERENCE_RECOGNITION_QUESTIONS,
        Math.max(0, Math.floor(limit)),
      )
    : MAX_REFERENCE_RECOGNITION_QUESTIONS;
  if (normalizedLimit === 0) return [];

  const group = groupForId(dataset, groupId);
  if (!group) return [];

  const targetsByLexeme = targetIndexFor(targets);
  const candidates = group.items
    .map((item) => ({
      item,
      target: targetsByLexeme.get(canonicalizeLexemeId(item.lexemeId)),
    }))
    .filter(
      (candidate): candidate is {
        item: ResolvedVocabularyItem;
        target: VocabularyTargetEntry;
      } =>
        itemIsReferenceOnlyCandidate(candidate.item, candidate.target) &&
        !hasRecognitionAttemptOnDate(
          progress,
          canonicalizeLexemeId(candidate.item.lexemeId),
          normalizedDate,
        ),
    )
    .map((candidate) => ({
      ...candidate,
      masteryState: deriveVocabularyMasteryState(
        progress[canonicalizeLexemeId(candidate.item.lexemeId)],
      ),
    }))
    .sort(stableTargetOrder);

  return candidates.flatMap(({ item, target }) => {
    const question = buildReferenceRecognitionQuestion({
      group,
      item,
      target,
      studyDate: normalizedDate,
    });
    return question ? [question] : [];
  }).slice(0, normalizedLimit);
};

const questionIsReferenceRecognition = (
  question: ReferenceRecognitionQuestion,
) => {
  const canonicalLexemeId = canonicalizeLexemeId(question.lexemeId);
  return (
    question.qaStatus.trim().toLowerCase() === REFERENCE_QA_STATUS &&
    (question.sourceLevel === "A1" || question.sourceLevel === "A2") &&
    isValidStudyDate(question.studyDate) &&
    isSingleLexemeWord(canonicalLexemeId) &&
    question.id ===
      `reference-recognition:${question.studyDate}:${canonicalLexemeId}` &&
    question.options.length === 4 &&
    question.options.every((option) => Boolean(normalizeOption(option))) &&
    new Set(question.options.map(normalizeOption)).size === 4 &&
    question.options.some(
      (option) => normalizeOption(option) === normalizeOption(question.answer),
    )
  );
};

const questionMatchesLegalSource = (
  question: ReferenceRecognitionQuestion,
  dataset: VocabularyDataset,
  targets: VocabularyTargetsData,
) => {
  const group = groupForId(dataset, question.groupId);
  if (!group) return false;
  const canonicalLexemeId = canonicalizeLexemeId(question.lexemeId);
  const matchingItems = group.items.filter(
    (item) => canonicalizeLexemeId(item.lexemeId) === canonicalLexemeId,
  );
  if (matchingItems.length !== 1) return false;
  const target = targetForLexeme(targets, canonicalLexemeId);
  if (!target) return false;
  const legalQuestion = buildReferenceRecognitionQuestion({
    group,
    item: matchingItems[0],
    target,
    studyDate: question.studyDate,
  });
  if (!legalQuestion) return false;
  return (
    question.id === legalQuestion.id &&
    question.groupId === legalQuestion.groupId &&
    question.lexemeId === legalQuestion.lexemeId &&
    question.studyDate === legalQuestion.studyDate &&
    question.displayEnglish === legalQuestion.displayEnglish &&
    question.answer === legalQuestion.answer &&
    JSON.stringify(question.options) === JSON.stringify(legalQuestion.options) &&
    question.sourceLevel === legalQuestion.sourceLevel &&
    question.qaStatus === legalQuestion.qaStatus
  );
};

/**
 * Records at most one recognition submission per canonical lexeme and local
 * study date. A wrong first answer cannot be repaired by a second submission
 * on the same day, so the correct evidence remains absent until another day.
 */
export const recordReferenceRecognitionResult = (
  progress: GlobalVocabularyProgress,
  {
    dataset,
    targets,
    question,
    selectedAnswer,
    studiedAt = new Date().toISOString(),
    studyDate,
  }: RecordReferenceRecognitionResultInput,
): GlobalVocabularyProgress => {
  if (
    !questionIsReferenceRecognition(question) ||
    !questionMatchesLegalSource(question, dataset, targets)
  ) {
    throw new Error("參考詞彙辨認題目不是合法的待複核資料，已拒絕記錄。");
  }
  const normalizedSelectedAnswer = normalizeOption(selectedAnswer);
  if (
    !question.options.some(
      (option) => normalizeOption(option) === normalizedSelectedAnswer,
    )
  ) {
    throw new Error("參考詞彙辨認答案不是本題選項，已拒絕記錄。");
  }

  const parsedStudiedAt = new Date(studiedAt);
  if (!Number.isFinite(parsedStudiedAt.getTime())) {
    throw new Error("參考詞彙辨認作答時間格式不正確，已拒絕記錄。");
  }
  const resolvedStudyDate = normalizedStudyDate(
    studyDate ?? question.studyDate,
  );
  if (resolvedStudyDate !== question.studyDate) {
    throw new Error("參考詞彙辨認題目日期已變更，請重新開始。");
  }
  if (localDateKey(parsedStudiedAt) !== resolvedStudyDate) {
    throw new Error("參考詞彙辨認作答不在題目日期，已拒絕記錄。");
  }
  const lexemeId = canonicalizeLexemeId(question.lexemeId);
  if (hasRecognitionAttemptOnDate(progress, lexemeId, resolvedStudyDate)) {
    return progress;
  }

  const evidenceId = question.id;
  const attempted = recordGlobalVocabularyEvidence(progress, {
    lexemeIds: [lexemeId],
    kind: "recognitionAttempt",
    evidenceId,
    studiedAt,
    studyDate: resolvedStudyDate,
    sourceLevel: question.sourceLevel,
  });
  if (
    normalizedSelectedAnswer !== normalizeOption(question.answer)
  ) {
    return attempted;
  }
  return recordGlobalVocabularyEvidence(attempted, {
    lexemeIds: [lexemeId],
    kind: "recognitionCorrect",
    evidenceId,
    studiedAt,
    studyDate: resolvedStudyDate,
    sourceLevel: question.sourceLevel,
  });
};

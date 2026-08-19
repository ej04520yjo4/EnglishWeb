import type { CefrLevel } from "./curriculum/types.ts";
import type { ReviewScheduleItem } from "./learning-progress.ts";
import type { GlobalVocabularyProgress } from "./vocabulary-progress.ts";
import { normalizeVocabularyEvidence } from "./vocabulary-progress.ts";
import type { VocabularyTargetsData } from "./vocabulary-targets.ts";
import {
  buildVocabularyTargetAliasIndex,
  canonicalizeLexemeId,
} from "./vocabulary-targets.ts";

export const DAILY_REVIEW_LIMIT = 5;

export type DailyReviewMode = "spelling" | "recognition" | "application";

export type DailyReviewSource = {
  occurrenceId: string;
  lexemeId: string;
  level: CefrLevel;
  answer: string;
  prompt: string;
  lessonId: string;
  sentenceId: string;
  sentence: string;
  translation: string;
};

/**
 * Persisted queue identity. Answers and prompts remain in the formal curriculum
 * source and are resolved again by occurrenceId after a reload.
 */
export type DailyReviewQueueItem = {
  id: string;
  level: CefrLevel;
  occurrenceId: string;
  lexemeId: string;
  mode: DailyReviewMode;
};

export type BuildDailyReviewQueueInput = {
  dueReviews: readonly ReviewScheduleItem[];
  vocabularyProgress: GlobalVocabularyProgress;
  vocabularyTargets: VocabularyTargetsData | null;
  sources: readonly DailyReviewSource[];
  limit?: number;
};

const wrongEvidenceCount = (attempts: readonly string[], correct: readonly string[]) =>
  Math.max(0, attempts.length - correct.length);

const hasApplicationSource = (source: DailyReviewSource) =>
  Boolean(
    source.lessonId.trim() &&
      source.sentenceId.trim() &&
      source.sentence.trim() &&
      source.translation.trim(),
  );

const chooseDailyReviewMode = (
  progress: GlobalVocabularyProgress,
  lexemeId: string,
  source: DailyReviewSource,
  rotationIndex: number,
): DailyReviewMode => {
  const evidence = normalizeVocabularyEvidence(progress[lexemeId]);
  const weaknesses: Array<{ mode: DailyReviewMode; wrong: number }> = [
    {
      mode: "spelling",
      wrong: wrongEvidenceCount(
        evidence.spellingAttemptEvidenceIds,
        evidence.spellingCorrectEvidenceIds,
      ),
    },
    {
      mode: "recognition",
      wrong: wrongEvidenceCount(
        evidence.recognitionAttemptEvidenceIds,
        evidence.recognitionCorrectEvidenceIds,
      ),
    },
    {
      mode: "application",
      wrong: hasApplicationSource(source)
        ? wrongEvidenceCount(
            evidence.applicationAttemptEvidenceIds,
            evidence.applicationCorrectEvidenceIds,
          )
        : 0,
    },
  ];
  const strongest = weaknesses.reduce((current, candidate) =>
    candidate.wrong > current.wrong ? candidate : current,
  );
  if (strongest.wrong > 0) return strongest.mode;

  const rotation: DailyReviewMode[] = hasApplicationSource(source)
    ? ["spelling", "recognition", "application"]
    : ["spelling", "recognition"];
  return rotation[rotationIndex % rotation.length];
};

const dueTime = (item: ReviewScheduleItem) => {
  const parsed = Date.parse(item.dueAt);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

export const buildDailyReviewQueue = ({
  dueReviews,
  vocabularyProgress,
  vocabularyTargets,
  sources,
  limit = DAILY_REVIEW_LIMIT,
}: BuildDailyReviewQueueInput): DailyReviewQueueItem[] => {
  if (limit <= 0) return [];
  const targetAliases = vocabularyTargets
    ? buildVocabularyTargetAliasIndex(vocabularyTargets)
    : new Map<string, string>();
  vocabularyTargets?.entries.forEach((entry) => {
    targetAliases.set(canonicalizeLexemeId(entry.lexemeId), entry.lexemeId);
  });
  const sourceByOccurrence = new Map(
    sources.map((source) => [source.occurrenceId, source]),
  );
  const seenOccurrenceIds = new Set<string>();
  const seenLexemeIds = new Set<string>();
  const queue: DailyReviewQueueItem[] = [];
  const queueLimit = Math.min(
    DAILY_REVIEW_LIMIT,
    Math.max(0, Math.floor(limit)),
  );

  const sortedReviews = [...dueReviews].sort((left, right) => {
    const timeDifference = dueTime(left) - dueTime(right);
    return timeDifference || left.tokenId.localeCompare(right.tokenId);
  });

  for (const review of sortedReviews) {
    if (queue.length >= queueLimit) break;
    const source = sourceByOccurrence.get(review.tokenId);
    if (!source || seenOccurrenceIds.has(source.occurrenceId)) continue;
    const sourceLexemeId = canonicalizeLexemeId(source.lexemeId);
    const lexemeId =
      targetAliases.get(sourceLexemeId) ??
      (vocabularyTargets ? "" : sourceLexemeId);
    if (!lexemeId || seenLexemeIds.has(lexemeId)) continue;
    const mode = chooseDailyReviewMode(
      vocabularyProgress,
      lexemeId,
      source,
      queue.length,
    );
    queue.push({
      id: `daily-review:${source.occurrenceId}:${mode}`,
      level: source.level,
      occurrenceId: source.occurrenceId,
      lexemeId,
      mode,
    });
    seenOccurrenceIds.add(source.occurrenceId);
    seenLexemeIds.add(lexemeId);
  }
  return queue;
};

const stableHash = (value: string) => {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

const normalizedPrompt = (value: string) => value.trim().replace(/\s+/g, " ");

/** Returns reproducible Traditional Chinese options with the answer included. */
export const buildDailyRecognitionOptions = (
  source: DailyReviewSource,
  sources: readonly DailyReviewSource[],
  optionCount = 4,
): string[] => {
  const answer = normalizedPrompt(source.prompt);
  if (!answer || optionCount <= 0) return [];
  const count = Math.max(1, Math.floor(optionCount));
  const seed = `${source.occurrenceId}:${source.lexemeId}`;
  const distractors = [
    ...new Set(
      sources
        .filter((candidate) => candidate.occurrenceId !== source.occurrenceId)
        .map((candidate) => normalizedPrompt(candidate.prompt))
        .filter((prompt) => prompt && prompt !== answer),
    ),
  ]
    .sort((left, right) => {
      const scoreDifference =
        stableHash(`${seed}:${left}`) - stableHash(`${seed}:${right}`);
      return scoreDifference || left.localeCompare(right);
    })
    .slice(0, count - 1);

  return [answer, ...distractors].sort((left, right) => {
    const scoreDifference =
      stableHash(`${seed}:position:${left}`) -
      stableHash(`${seed}:position:${right}`);
    return scoreDifference || left.localeCompare(right);
  });
};

export const resolveDailyReviewSource = (
  item: DailyReviewQueueItem,
  sources: readonly DailyReviewSource[],
): DailyReviewSource | null =>
  sources.find(
    (source) =>
      source.occurrenceId === item.occurrenceId &&
      source.level === item.level,
  ) ?? null;

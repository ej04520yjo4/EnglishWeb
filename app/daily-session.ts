import { CEFR_LEVELS, type CefrLevel } from "./curriculum/types.ts";
import type { DailyReviewQueueItem } from "./daily-review.ts";
import { localDateKey } from "./local-date.ts";

export type DailyVocabularySummary = {
  exposed: number;
  receptive: number;
  active: number;
};

export type DailySessionStep = "review" | "lesson" | "weakness";

export type DailyReviewItemProgress = {
  attempts: number;
  answerRevealed: boolean;
  usedPaste: boolean;
};

export type DailySessionState = {
  version: 3;
  localDate: string;
  level: CefrLevel;
  startedAt: number;
  lessonId: string;
  reviewCount: number;
  reviewItems: DailyReviewQueueItem[];
  completedReviewItemIds: string[];
  reviewItemProgress: Record<string, DailyReviewItemProgress>;
  weaknessLexemeIds: string[];
  completedWeaknessLexemeIds: string[];
  completedSteps: DailySessionStep[];
  beforeVocabulary: DailyVocabularySummary;
  activeStudySeconds: number;
  activeStartedAt: number | null;
};

export const DAILY_ACTIVE_SEGMENT_CAP_SECONDS = 5 * 60;

export const createDailySession = (input: {
  startedAt?: number;
  localDate?: string;
  level: CefrLevel;
  lessonId: string;
  reviewItems: DailyReviewQueueItem[];
  weaknessLexemeIds: string[];
  beforeVocabulary: DailyVocabularySummary;
}): DailySessionState => {
  const startedAt = input.startedAt ?? Date.now();
  const reviewItems = uniqueDailyReviewItems(input.reviewItems)
    .filter((item) => item.level === input.level)
    .slice(0, 5);
  return {
    version: 3,
    localDate: input.localDate ?? localDateKey(new Date(startedAt)),
    level: input.level,
    startedAt,
    lessonId: input.lessonId,
    reviewCount: reviewItems.length,
    reviewItems,
    completedReviewItemIds: [],
    reviewItemProgress: {},
    weaknessLexemeIds: [...new Set(input.weaknessLexemeIds)].slice(0, 3),
    completedWeaknessLexemeIds: [],
    completedSteps: [],
    beforeVocabulary: { ...input.beforeVocabulary },
    activeStudySeconds: 0,
    activeStartedAt: null,
  };
};

const isDailyReviewQueueItem = (
  value: unknown,
): value is DailyReviewQueueItem => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    CEFR_LEVELS.includes(item.level as CefrLevel) &&
    typeof item.occurrenceId === "string" &&
    item.occurrenceId.length > 0 &&
    typeof item.lexemeId === "string" &&
    item.lexemeId.length > 0 &&
    ["spelling", "recognition", "application"].includes(String(item.mode))
  );
};

const uniqueDailyReviewItems = (
  items: readonly DailyReviewQueueItem[],
): DailyReviewQueueItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!isDailyReviewQueueItem(item) || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const normalizeDailyReviewItemProgress = (
  value: unknown,
  itemIds: Set<string>,
): Record<string, DailyReviewItemProgress> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([itemId, raw]) => {
      if (!itemIds.has(itemId) || !raw || typeof raw !== "object" || Array.isArray(raw)) {
        return [];
      }
      const progress = raw as Partial<DailyReviewItemProgress>;
      if (
        !Number.isFinite(progress.attempts) ||
        Number(progress.attempts) < 0 ||
        typeof progress.answerRevealed !== "boolean" ||
        typeof progress.usedPaste !== "boolean"
      ) {
        return [];
      }
      return [[itemId, {
        attempts: Math.floor(Number(progress.attempts)),
        answerRevealed: progress.answerRevealed,
        usedPaste: progress.usedPaste,
      }]];
    }),
  );
};

const isDailyVocabularySummary = (
  value: unknown,
): value is DailyVocabularySummary => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const summary = value as Record<string, unknown>;
  return ["exposed", "receptive", "active"].every(
    (key) => Number.isFinite(summary[key]) && Number(summary[key]) >= 0,
  );
};

export const restoreDailySession = (
  serialized: string,
  todayLocalDate = localDateKey(),
): DailySessionState | null => {
  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const session = value as Partial<DailySessionState>;
  const completedSteps = session.completedSteps;
  if (
    session.version !== 3 ||
    session.localDate !== todayLocalDate ||
    !CEFR_LEVELS.includes(session.level as CefrLevel) ||
    !Number.isFinite(session.startedAt) ||
    typeof session.lessonId !== "string" ||
    !Array.isArray(session.reviewItems) ||
    !session.reviewItems.every(isDailyReviewQueueItem) ||
    !session.reviewItems.every((item) => item.level === session.level) ||
    !Array.isArray(session.completedReviewItemIds) ||
    !session.completedReviewItemIds.every((item) => typeof item === "string") ||
    !Array.isArray(session.weaknessLexemeIds) ||
    !session.weaknessLexemeIds.every((item) => typeof item === "string") ||
    !Array.isArray(session.completedWeaknessLexemeIds) ||
    !session.completedWeaknessLexemeIds.every(
      (item) => typeof item === "string",
    ) ||
    !Array.isArray(completedSteps) ||
    !completedSteps.every((step) =>
      (["review", "lesson", "weakness"] as DailySessionStep[]).includes(step),
    ) ||
    !isDailyVocabularySummary(session.beforeVocabulary) ||
    !Number.isFinite(session.activeStudySeconds) ||
    Number(session.activeStudySeconds) < 0 ||
    !(
      session.activeStartedAt === null ||
      (Number.isFinite(session.activeStartedAt) &&
        Number(session.activeStartedAt) >= 0)
    )
  ) {
    return null;
  }
  const reviewItems = uniqueDailyReviewItems(session.reviewItems).slice(0, 5);
  const reviewItemIds = new Set(reviewItems.map((item) => item.id));
  const completedReviewItemIds = [
    ...new Set(session.completedReviewItemIds),
  ].filter((itemId) => reviewItemIds.has(itemId));
  const reviewItemProgress = normalizeDailyReviewItemProgress(
    session.reviewItemProgress,
    reviewItemIds,
  );
  const weaknessLexemeIds = [...new Set(session.weaknessLexemeIds)].slice(0, 3);
  const weaknessLexemeIdSet = new Set(weaknessLexemeIds);
  const completedWeaknessLexemeIds = [
    ...new Set(session.completedWeaknessLexemeIds),
  ].filter((lexemeId) => weaknessLexemeIdSet.has(lexemeId));
  const normalizedCompletedSteps: DailySessionStep[] = [
    ...new Set(
      completedSteps.filter(
        (step) => step !== "review" && step !== "weakness",
      ),
    ),
  ];
  if (
    reviewItems.length > 0 &&
    completedReviewItemIds.length === reviewItems.length
  ) {
    normalizedCompletedSteps.push("review");
  }
  if (
    weaknessLexemeIds.length > 0 &&
    completedWeaknessLexemeIds.length === weaknessLexemeIds.length
  ) {
    normalizedCompletedSteps.push("weakness");
  }
  return {
    version: 3,
    localDate: session.localDate,
    level: session.level as CefrLevel,
    startedAt: Number(session.startedAt),
    lessonId: session.lessonId,
    reviewCount: reviewItems.length,
    reviewItems,
    completedReviewItemIds,
    reviewItemProgress,
    weaknessLexemeIds,
    completedWeaknessLexemeIds,
    completedSteps: normalizedCompletedSteps,
    beforeVocabulary: { ...session.beforeVocabulary },
    activeStudySeconds: Number(session.activeStudySeconds),
    activeStartedAt: null,
  };
};

export const isDailySessionCurrentDay = (
  session: Pick<DailySessionState, "localDate">,
  todayLocalDate = localDateKey(),
) => session.localDate === todayLocalDate;

export const markDailySessionStep = (
  session: DailySessionState,
  step: DailySessionStep,
): DailySessionState => {
  if (
    (step === "review" && remainingDailyReviewItems(session).length > 0) ||
    step === "weakness" &&
    remainingDailyWeaknessLexemeIds(session).length > 0
  ) {
    return session;
  }
  return session.completedSteps.includes(step)
    ? session
    : {
        ...session,
        completedSteps: [...session.completedSteps, step],
      };
};

export const remainingDailyReviewItems = (
  session: DailySessionState,
): DailyReviewQueueItem[] => {
  const completed = new Set(session.completedReviewItemIds);
  return session.reviewItems.filter((item) => !completed.has(item.id));
};

export const updateDailyReviewItemProgress = (
  session: DailySessionState,
  itemId: string,
  update: Partial<DailyReviewItemProgress>,
): DailySessionState => {
  if (!session.reviewItems.some((item) => item.id === itemId)) return session;
  const current = session.reviewItemProgress[itemId] ?? {
    attempts: 0,
    answerRevealed: false,
    usedPaste: false,
  };
  return {
    ...session,
    reviewItemProgress: {
      ...session.reviewItemProgress,
      [itemId]: {
        attempts: Math.max(0, Math.floor(update.attempts ?? current.attempts)),
        answerRevealed:
          current.answerRevealed || Boolean(update.answerRevealed),
        usedPaste: current.usedPaste || Boolean(update.usedPaste),
      },
    },
  };
};

export const markDailyReviewCompleted = (
  session: DailySessionState,
  itemId: string,
): DailySessionState => {
  if (
    !session.reviewItems.some((item) => item.id === itemId) ||
    session.completedReviewItemIds.includes(itemId)
  ) {
    return session;
  }
  const updated: DailySessionState = {
    ...session,
    completedReviewItemIds: [...session.completedReviewItemIds, itemId],
  };
  return remainingDailyReviewItems(updated).length === 0
    ? {
        ...updated,
        completedSteps: updated.completedSteps.includes("review")
          ? updated.completedSteps
          : [...updated.completedSteps, "review"],
      }
    : updated;
};

export const remainingDailyWeaknessLexemeIds = (
  session: DailySessionState,
): string[] => {
  const completed = new Set(session.completedWeaknessLexemeIds);
  return session.weaknessLexemeIds.filter(
    (lexemeId) => !completed.has(lexemeId),
  );
};

export const markDailyWeaknessCompleted = (
  session: DailySessionState,
  lexemeId: string,
): DailySessionState => {
  if (
    !session.weaknessLexemeIds.includes(lexemeId) ||
    session.completedWeaknessLexemeIds.includes(lexemeId)
  ) {
    return session;
  }
  const updated: DailySessionState = {
    ...session,
    completedWeaknessLexemeIds: [
      ...session.completedWeaknessLexemeIds,
      lexemeId,
    ],
  };
  return remainingDailyWeaknessLexemeIds(updated).length === 0
    ? {
        ...updated,
        completedSteps: updated.completedSteps.includes("weakness")
          ? updated.completedSteps
          : [...updated.completedSteps, "weakness"],
      }
    : updated;
};

export const nextDailySessionStep = (
  session: DailySessionState,
): DailySessionStep | "summary" => {
  if (
    remainingDailyReviewItems(session).length > 0
  ) {
    return "review";
  }
  if (session.lessonId && !session.completedSteps.includes("lesson")) {
    return "lesson";
  }
  if (
    remainingDailyWeaknessLexemeIds(session).length > 0 &&
    !session.completedSteps.includes("weakness")
  ) {
    return "weakness";
  }
  return "summary";
};

const activeSegmentSeconds = (
  session: DailySessionState,
  now: number,
  capSeconds: number,
) => {
  if (session.activeStartedAt === null) return 0;
  return Math.min(
    Math.max(0, capSeconds),
    Math.max(0, now - session.activeStartedAt) / 1_000,
  );
};

export const startDailyActiveSegment = (
  session: DailySessionState,
  now = Date.now(),
): DailySessionState =>
  session.activeStartedAt === null
    ? { ...session, activeStartedAt: now }
    : session;

export const pauseDailyActiveSegment = (
  session: DailySessionState,
  now = Date.now(),
  capSeconds = DAILY_ACTIVE_SEGMENT_CAP_SECONDS,
): DailySessionState => {
  if (session.activeStartedAt === null) return session;
  return {
    ...session,
    activeStudySeconds:
      session.activeStudySeconds + activeSegmentSeconds(session, now, capSeconds),
    activeStartedAt: null,
  };
};

export const checkpointDailyActiveSegment = (
  session: DailySessionState,
  now = Date.now(),
  capSeconds = DAILY_ACTIVE_SEGMENT_CAP_SECONDS,
): DailySessionState => {
  if (session.activeStartedAt === null) return session;
  return {
    ...pauseDailyActiveSegment(session, now, capSeconds),
    activeStartedAt: now,
  };
};

export const dailyActiveStudySeconds = (
  session: DailySessionState,
  now = Date.now(),
  capSeconds = DAILY_ACTIVE_SEGMENT_CAP_SECONDS,
) => session.activeStudySeconds + activeSegmentSeconds(session, now, capSeconds);

export const summarizeDailySession = (
  session: DailySessionState,
  afterVocabulary: DailyVocabularySummary,
  now = Date.now(),
) => ({
  elapsedMinutes:
    dailyActiveStudySeconds(session, now) > 0
      ? Math.max(1, Math.ceil(dailyActiveStudySeconds(session, now) / 60))
      : 0,
  reviewCount: session.completedSteps.includes("review")
    ? session.completedReviewItemIds.length
    : 0,
  lessonCompleted: session.completedSteps.includes("lesson"),
  weaknessCount: session.completedSteps.includes("weakness")
    ? session.completedWeaknessLexemeIds.length
    : 0,
  exposedDelta: Math.max(
    0,
    afterVocabulary.exposed - session.beforeVocabulary.exposed,
  ),
  receptiveDelta: Math.max(
    0,
    afterVocabulary.receptive - session.beforeVocabulary.receptive,
  ),
  activeDelta: Math.max(
    0,
    afterVocabulary.active - session.beforeVocabulary.active,
  ),
  complete: nextDailySessionStep(session) === "summary",
});

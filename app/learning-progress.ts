export type LearningEntityProgress = {
  attempts: number;
  correctAnswers: number;
  completedLessonIds: string[];
  lastLessonId: string;
  lastSeenAt: string;
};

export type LearningEntityProgressMap = Record<string, LearningEntityProgress>;

export type TokenLearningProgress = {
  attempts: number;
  hintsUsed: number;
  answerRevealed: boolean;
  elapsedSeconds: number;
  audioReplays: number;
  usedPaste: boolean;
  correctAnswers: number;
  lastAnsweredAt: string;
};

export type TokenLearningProgressMap = Record<string, TokenLearningProgress>;

export type ReviewFamiliarity = "熟悉" | "不熟" | "完全不會";

export type ReviewScheduleItem = {
  tokenId: string;
  answer: string;
  prompt: string;
  familiarity: ReviewFamiliarity;
  dueAt: string;
  intervalDays: number;
  successfulDays: number;
};

export const emptyTokenLearningProgress = (): TokenLearningProgress => ({
  attempts: 0,
  hintsUsed: 0,
  answerRevealed: false,
  elapsedSeconds: 0,
  audioReplays: 0,
  usedPaste: false,
  correctAnswers: 0,
  lastAnsweredAt: "",
});

export const updateTokenLearningProgress = (
  progress: TokenLearningProgressMap,
  occurrenceId: string,
  update: Partial<TokenLearningProgress> & {
    attemptDelta?: number;
    hintDelta?: number;
    elapsedDelta?: number;
    audioReplayDelta?: number;
    correctDelta?: number;
  },
  answeredAt = new Date().toISOString(),
): TokenLearningProgressMap => {
  const current = progress[occurrenceId] ?? emptyTokenLearningProgress();
  const {
    attemptDelta = 0,
    hintDelta = 0,
    elapsedDelta = 0,
    audioReplayDelta = 0,
    correctDelta = 0,
    ...replacement
  } = update;
  return {
    ...progress,
    [occurrenceId]: {
      ...current,
      ...replacement,
      attempts: current.attempts + attemptDelta,
      hintsUsed: current.hintsUsed + hintDelta,
      elapsedSeconds: current.elapsedSeconds + elapsedDelta,
      audioReplays: current.audioReplays + audioReplayDelta,
      correctAnswers: current.correctAnswers + correctDelta,
      answerRevealed:
        current.answerRevealed || Boolean(replacement.answerRevealed),
      usedPaste: current.usedPaste || Boolean(replacement.usedPaste),
      lastAnsweredAt: answeredAt,
    },
  };
};

export const reviewIntervalForToken = (
  performance: TokenLearningProgress | undefined,
) => {
  if (!performance) return 1;
  if (
    performance.answerRevealed ||
    performance.attempts >= 3 ||
    performance.hintsUsed >= 2 ||
    performance.elapsedSeconds >= 25 ||
    performance.audioReplays >= 3
  ) {
    return 1;
  }
  if (
    performance.attempts === 1 &&
    performance.hintsUsed === 0 &&
    performance.elapsedSeconds <= 12 &&
    performance.audioReplays <= 1 &&
    !performance.usedPaste
  ) {
    return 3;
  }
  return 2;
};

export const adjustReviewInterval = (
  previousIntervalDays: number | undefined,
  recommendedIntervalDays: number,
  familiarity: ReviewFamiliarity,
) => {
  if (!previousIntervalDays) return recommendedIntervalDays;
  if (recommendedIntervalDays <= 1) {
    return Math.max(1, Math.ceil(previousIntervalDays * 0.75));
  }
  if (recommendedIntervalDays === 2) {
    return Math.max(2, previousIntervalDays);
  }
  return Math.max(
    3,
    previousIntervalDays + (familiarity === "熟悉" ? 1 : 0),
  );
};

export const scheduleTokenReview = (
  existing: ReviewScheduleItem | undefined,
  token: Pick<ReviewScheduleItem, "tokenId" | "answer" | "prompt">,
  recommendedIntervalDays: number,
  now = new Date(),
): ReviewScheduleItem => {
  const familiarity =
    existing?.familiarity ??
    (recommendedIntervalDays >= 3 ? "熟悉" : "不熟");
  const intervalDays = adjustReviewInterval(
    existing?.intervalDays,
    recommendedIntervalDays,
    familiarity,
  );
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);
  return {
    ...token,
    familiarity,
    intervalDays,
    dueAt: dueAt.toISOString(),
    successfulDays: existing?.successfulDays ?? 0,
  };
};

export const rescheduleCompletedReview = (
  existing: ReviewScheduleItem,
  successful: boolean,
  now = new Date(),
): ReviewScheduleItem => {
  const scheduled = scheduleTokenReview(
    existing,
    {
      tokenId: existing.tokenId,
      answer: existing.answer,
      prompt: existing.prompt,
    },
    successful ? 3 : 1,
    now,
  );
  if (successful) {
    return {
      ...scheduled,
      successfulDays: existing.successfulDays + 1,
    };
  }
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + 1);
  return {
    ...scheduled,
    intervalDays: 1,
    dueAt: dueAt.toISOString(),
    successfulDays: existing.successfulDays,
  };
};

export const serializeLearningProgress = <T>(progress: T) =>
  JSON.stringify(progress);

export const restoreLearningProgress = <T>(serialized: string): T =>
  JSON.parse(serialized) as T;

export const recordLearningEntityAttempt = (
  progress: LearningEntityProgressMap,
  entityId: string | undefined,
  lessonId: string,
  isCorrect: boolean,
  seenAt = new Date().toISOString(),
): LearningEntityProgressMap => {
  if (!entityId) return progress;
  const current = progress[entityId] ?? {
    attempts: 0,
    correctAnswers: 0,
    completedLessonIds: [],
    lastLessonId: lessonId,
    lastSeenAt: seenAt,
  };
  return {
    ...progress,
    [entityId]: {
      ...current,
      attempts: current.attempts + 1,
      correctAnswers: current.correctAnswers + (isCorrect ? 1 : 0),
      lastLessonId: lessonId,
      lastSeenAt: seenAt,
    },
  };
};

export const recordLearningEntityCompletion = (
  progress: LearningEntityProgressMap,
  entityId: string | undefined,
  lessonId: string,
  completedAt = new Date().toISOString(),
): LearningEntityProgressMap => {
  if (!entityId) return progress;
  const current = progress[entityId] ?? {
    attempts: 0,
    correctAnswers: 0,
    completedLessonIds: [],
    lastLessonId: lessonId,
    lastSeenAt: completedAt,
  };
  return {
    ...progress,
    [entityId]: {
      ...current,
      completedLessonIds: Array.from(new Set([...current.completedLessonIds, lessonId])),
      lastLessonId: lessonId,
      lastSeenAt: completedAt,
    },
  };
};

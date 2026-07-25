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

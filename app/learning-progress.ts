export type LearningEntityProgress = {
  attempts: number;
  correctAnswers: number;
  completedLessonIds: string[];
  lastLessonId: string;
  lastSeenAt: string;
};

export type LearningEntityProgressMap = Record<string, LearningEntityProgress>;

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

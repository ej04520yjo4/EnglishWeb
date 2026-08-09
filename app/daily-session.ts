export type DailyVocabularySummary = {
  exposed: number;
  receptive: number;
  active: number;
};

export type DailySessionStep = "review" | "lesson" | "weakness";

export type DailySessionState = {
  startedAt: number;
  lessonId: string;
  reviewCount: number;
  weaknessLexemeIds: string[];
  completedSteps: DailySessionStep[];
  beforeVocabulary: DailyVocabularySummary;
};

export const createDailySession = (input: {
  startedAt?: number;
  lessonId: string;
  reviewCount: number;
  weaknessLexemeIds: string[];
  beforeVocabulary: DailyVocabularySummary;
}): DailySessionState => ({
  startedAt: input.startedAt ?? Date.now(),
  lessonId: input.lessonId,
  reviewCount: Math.max(0, input.reviewCount),
  weaknessLexemeIds: [...new Set(input.weaknessLexemeIds)].slice(0, 3),
  completedSteps: [],
  beforeVocabulary: { ...input.beforeVocabulary },
});

export const markDailySessionStep = (
  session: DailySessionState,
  step: DailySessionStep,
): DailySessionState =>
  session.completedSteps.includes(step)
    ? session
    : {
        ...session,
        completedSteps: [...session.completedSteps, step],
      };

export const nextDailySessionStep = (
  session: DailySessionState,
): DailySessionStep | "summary" => {
  if (
    session.reviewCount > 0 &&
    !session.completedSteps.includes("review")
  ) {
    return "review";
  }
  if (session.lessonId && !session.completedSteps.includes("lesson")) {
    return "lesson";
  }
  if (
    session.weaknessLexemeIds.length > 0 &&
    !session.completedSteps.includes("weakness")
  ) {
    return "weakness";
  }
  return "summary";
};

export const summarizeDailySession = (
  session: DailySessionState,
  afterVocabulary: DailyVocabularySummary,
  now = Date.now(),
) => ({
  elapsedMinutes: Math.max(
    1,
    Math.ceil(Math.max(0, now - session.startedAt) / 60_000),
  ),
  reviewCount: session.completedSteps.includes("review")
    ? session.reviewCount
    : 0,
  lessonCompleted: session.completedSteps.includes("lesson"),
  weaknessCount: session.completedSteps.includes("weakness")
    ? session.weaknessLexemeIds.length
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

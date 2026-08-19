import { CEFR_LEVELS, type CefrLevel } from "./curriculum/types.ts";
import { localDateKey } from "./local-date.ts";

export type DailyVocabularySummary = {
  exposed: number;
  receptive: number;
  active: number;
};

export type DailySessionStep = "review" | "lesson" | "weakness";

export type DailySessionState = {
  version: 2;
  localDate: string;
  level: CefrLevel;
  startedAt: number;
  lessonId: string;
  reviewCount: number;
  weaknessLexemeIds: string[];
  completedWeaknessLexemeIds: string[];
  completedSteps: DailySessionStep[];
  beforeVocabulary: DailyVocabularySummary;
};

export const createDailySession = (input: {
  startedAt?: number;
  localDate?: string;
  level: CefrLevel;
  lessonId: string;
  reviewCount: number;
  weaknessLexemeIds: string[];
  beforeVocabulary: DailyVocabularySummary;
}): DailySessionState => {
  const startedAt = input.startedAt ?? Date.now();
  return {
    version: 2,
    localDate: input.localDate ?? localDateKey(new Date(startedAt)),
    level: input.level,
    startedAt,
    lessonId: input.lessonId,
    reviewCount: Math.max(0, input.reviewCount),
    weaknessLexemeIds: [...new Set(input.weaknessLexemeIds)].slice(0, 3),
    completedWeaknessLexemeIds: [],
    completedSteps: [],
    beforeVocabulary: { ...input.beforeVocabulary },
  };
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
    session.version !== 2 ||
    session.localDate !== todayLocalDate ||
    !CEFR_LEVELS.includes(session.level as CefrLevel) ||
    !Number.isFinite(session.startedAt) ||
    typeof session.lessonId !== "string" ||
    !Number.isFinite(session.reviewCount) ||
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
    !isDailyVocabularySummary(session.beforeVocabulary)
  ) {
    return null;
  }
  const weaknessLexemeIds = [...new Set(session.weaknessLexemeIds)].slice(0, 3);
  const weaknessLexemeIdSet = new Set(weaknessLexemeIds);
  const completedWeaknessLexemeIds = [
    ...new Set(session.completedWeaknessLexemeIds),
  ].filter((lexemeId) => weaknessLexemeIdSet.has(lexemeId));
  const normalizedCompletedSteps: DailySessionStep[] = [
    ...new Set(completedSteps.filter((step) => step !== "weakness")),
  ];
  if (
    weaknessLexemeIds.length > 0 &&
    completedWeaknessLexemeIds.length === weaknessLexemeIds.length
  ) {
    normalizedCompletedSteps.push("weakness");
  }
  return {
    version: 2,
    localDate: session.localDate,
    level: session.level as CefrLevel,
    startedAt: Number(session.startedAt),
    lessonId: session.lessonId,
    reviewCount: Math.max(0, Number(session.reviewCount)),
    weaknessLexemeIds,
    completedWeaknessLexemeIds,
    completedSteps: normalizedCompletedSteps,
    beforeVocabulary: { ...session.beforeVocabulary },
  };
};

export const markDailySessionStep = (
  session: DailySessionState,
  step: DailySessionStep,
): DailySessionState => {
  if (
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
    session.reviewCount > 0 &&
    !session.completedSteps.includes("review")
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

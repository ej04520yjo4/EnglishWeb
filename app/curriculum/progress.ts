import type {
  LearningEntityProgressMap,
  ReviewScheduleItem,
  TokenLearningProgressMap,
} from "../learning-progress";
import type {
  HintLevel,
  ReviewExerciseType,
} from "../learning-adaptation";
import type { CefrLevel } from "./types";

export type SentenceLearningStats = {
  rebuildAttempts: number;
  recognitionAttempts: number;
  recognitionCorrect: number;
  elapsedSeconds: number;
};

export type PatternLearningStats = {
  transferAttempts: number;
  transferCorrect: number;
  uniqueVariationsCompleted: string[];
  lastPracticedAt: string;
  nextReviewAt: string;
};

export type PassageLearningStats = {
  rebuildAttempts: number;
  comprehensionAttempts: number;
  comprehensionCorrect: number;
  lastPracticedAt: string;
};

export type LevelLearningProgress = {
  completedLessonIds: string[];
  passedUnitIds: string[];
  levelPassed: boolean;
  totalAttempts: number;
  correctAnswers: number;
  totalSeconds: number;
  pasteCount: number;
  studyDates: string[];
  reviewItems: Record<string, ReviewScheduleItem>;
  lexemeProgress: LearningEntityProgressMap;
  senseProgress: LearningEntityProgressMap;
  sentencePatternProgress: LearningEntityProgressMap;
  tokenProgress: TokenLearningProgressMap;
  sentenceStats: Record<string, SentenceLearningStats>;
  patternStats: Record<string, PatternLearningStats>;
  passageStats: Record<string, PassageLearningStats>;
  tokenHintLevels: Record<string, HintLevel>;
  chunkHintLevels: Record<string, HintLevel>;
  patternHintLevels: Record<string, HintLevel>;
  reviewExerciseTypes: Record<string, ReviewExerciseType[]>;
};

export type MultiLevelProgress = {
  schemaVersion: 4;
  selectedLevel: CefrLevel;
  passedLevelIds: string[];
  levelProgress: Record<CefrLevel, LevelLearningProgress>;
};

export const isLevelAssessmentEnabled = (level: CefrLevel) =>
  level === "A1";

export const createEmptyLevelProgress = (): LevelLearningProgress => ({
  completedLessonIds: [],
  passedUnitIds: [],
  levelPassed: false,
  totalAttempts: 0,
  correctAnswers: 0,
  totalSeconds: 0,
  pasteCount: 0,
  studyDates: [],
  reviewItems: {},
  lexemeProgress: {},
  senseProgress: {},
  sentencePatternProgress: {},
  tokenProgress: {},
  sentenceStats: {},
  patternStats: {},
  passageStats: {},
  tokenHintLevels: {},
  chunkHintLevels: {},
  patternHintLevels: {},
  reviewExerciseTypes: {},
});

export const normalizeLevelProgress = (
  value: Partial<LevelLearningProgress> | undefined,
): LevelLearningProgress => {
  const empty = createEmptyLevelProgress();
  return {
    ...empty,
    ...(value ?? {}),
    completedLessonIds: value?.completedLessonIds ?? [],
    passedUnitIds: value?.passedUnitIds ?? [],
    studyDates: value?.studyDates ?? [],
    reviewItems: value?.reviewItems ?? {},
    lexemeProgress: value?.lexemeProgress ?? {},
    senseProgress: value?.senseProgress ?? {},
    sentencePatternProgress: value?.sentencePatternProgress ?? {},
    tokenProgress: value?.tokenProgress ?? {},
    sentenceStats: value?.sentenceStats ?? {},
    patternStats: value?.patternStats ?? {},
    passageStats: value?.passageStats ?? {},
    tokenHintLevels: value?.tokenHintLevels ?? {},
    chunkHintLevels: value?.chunkHintLevels ?? {},
    patternHintLevels: value?.patternHintLevels ?? {},
    reviewExerciseTypes: value?.reviewExerciseTypes ?? {},
  };
};

export const createEmptyMultiLevelProgress = (): MultiLevelProgress => ({
  schemaVersion: 4,
  selectedLevel: "A1",
  passedLevelIds: [],
  levelProgress: {
    A1: createEmptyLevelProgress(),
    A2: createEmptyLevelProgress(),
  },
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const migrateProgressToV4 = (
  value: unknown,
): MultiLevelProgress => {
  if (!isObject(value)) {
    throw new Error("學習進度不是有效物件。");
  }

  if (value.schemaVersion === 4) {
    if (!isObject(value.levelProgress)) {
      throw new Error("多程度學習進度缺少 levelProgress。");
    }
    const selectedLevel =
      value.selectedLevel === "A2" ? "A2" : "A1";
    return {
      schemaVersion: 4,
      selectedLevel,
      passedLevelIds: Array.isArray(value.passedLevelIds)
        ? value.passedLevelIds.filter(
            (levelId): levelId is string =>
              typeof levelId === "string",
          )
        : [],
      levelProgress: {
        A1: normalizeLevelProgress(
          value.levelProgress.A1 as Partial<LevelLearningProgress>,
        ),
        A2: normalizeLevelProgress(
          value.levelProgress.A2 as Partial<LevelLearningProgress>,
        ),
      },
    };
  }

  if (value.schemaVersion !== 3) {
    throw new Error("只支援 schemaVersion 3 或 4 的學習進度。");
  }

  const legacy = normalizeLevelProgress(
    value as Partial<LevelLearningProgress>,
  );
  return {
    schemaVersion: 4,
    selectedLevel: "A1",
    passedLevelIds: legacy.levelPassed ? ["A1"] : [],
    levelProgress: {
      A1: legacy,
      A2: createEmptyLevelProgress(),
    },
  };
};

export const isLevelFormallyUnlocked = (
  level: CefrLevel,
  passedLevelIds: string[],
) => level === "A1" || passedLevelIds.includes("A1");

export const canAccessLevel = (
  level: CefrLevel,
  passedLevelIds: string[],
  showA2Pilot: boolean,
) =>
  isLevelFormallyUnlocked(level, passedLevelIds) ||
  (level === "A2" && showA2Pilot);

export const updateSelectedLevelProgress = (
  progress: MultiLevelProgress,
  update:
    | LevelLearningProgress
    | ((current: LevelLearningProgress) => LevelLearningProgress),
): MultiLevelProgress => {
  const level = progress.selectedLevel;
  const current = progress.levelProgress[level];
  const next =
    typeof update === "function" ? update(current) : update;
  return {
    ...progress,
    levelProgress: {
      ...progress.levelProgress,
      [level]: next,
    },
  };
};

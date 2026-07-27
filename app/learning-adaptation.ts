import type { TokenLearningProgress } from "./learning-progress";

export type HintLevel = 1 | 2 | 3 | 4;
export type LearningErrorType =
  | "spelling"
  | "word-order"
  | "meaning"
  | "pattern-transfer"
  | "passage-comprehension";
export type ReviewExerciseType =
  | "word-recall"
  | "sentence-rebuild"
  | "reading-recognition"
  | "pattern-transfer"
  | "passage-comprehension";

export const nextHintLevel = (
  currentLevel: HintLevel,
  performance: TokenLearningProgress | undefined,
): HintLevel => {
  if (
    !performance ||
    performance.answerRevealed ||
    performance.attempts >= 3
  ) {
    return 1;
  }
  if (
    performance.attempts === 1 &&
    performance.hintsUsed === 0 &&
    performance.elapsedSeconds <= 12
  ) {
    return Math.min(4, currentLevel + 1) as HintLevel;
  }
  if (
    performance.hintsUsed > 0 ||
    performance.elapsedSeconds > 20
  ) {
    return Math.min(currentLevel, 2) as HintLevel;
  }
  return Math.max(1, Math.min(3, currentLevel)) as HintLevel;
};

export const reviewExercisesForError = (
  errorType: LearningErrorType,
): ReviewExerciseType[] => {
  const mapping: Record<LearningErrorType, ReviewExerciseType[]> = {
    spelling: ["word-recall"],
    "word-order": ["sentence-rebuild"],
    meaning: ["reading-recognition"],
    "pattern-transfer": ["pattern-transfer"],
    "passage-comprehension": ["passage-comprehension"],
  };
  return mapping[errorType];
};

export const addReviewExercise = (
  current: ReviewExerciseType[] | undefined,
  errorType: LearningErrorType,
) =>
  Array.from(
    new Set([
      ...(current ?? []),
      ...reviewExercisesForError(errorType),
    ]),
  );

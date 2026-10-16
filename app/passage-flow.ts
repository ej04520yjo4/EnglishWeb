import type { Lesson } from "./course-data";
import { normalizeSentenceForComparison as normalizeSentence } from "./curriculum/sentence-words.ts";

export type PassageSentenceEvaluation = {
  sentenceId: string;
  correct: boolean;
  message: string;
  expected: string;
};

export const lessonsForPassage = (
  lessons: Lesson[],
  passageId: string,
) =>
  lessons
    .filter((lesson) => lesson.passageId === passageId)
    .sort(
      (left, right) =>
        left.sentenceOrder - right.sentenceOrder ||
        left.passageOrder - right.passageOrder,
    );

export type PassageRebuildGateInput = {
  displaySentenceCount: number;
  basePassageLessons: ReadonlyArray<Pick<Lesson, "id">>;
  customSentences: ReadonlyArray<{ lessonId?: string }>;
  currentLessonId: string;
  completedLessonIds: ReadonlyArray<string>;
  formalLessons: ReadonlyArray<Pick<Lesson, "id">>;
};

/**
 * Passage presentation may contain more sentences than the formal lesson
 * list.  Gate completion using only real lesson IDs, while failing closed if
 * custom content claims a prerequisite that is not in the formal catalogue.
 */
export const canStartPassageRebuild = ({
  displaySentenceCount,
  basePassageLessons,
  customSentences,
  currentLessonId,
  completedLessonIds,
  formalLessons,
}: PassageRebuildGateInput): boolean => {
  if (displaySentenceCount <= 1 || basePassageLessons.length === 0) {
    return false;
  }

  const formalLessonIds = new Set(formalLessons.map((lesson) => lesson.id));
  if (!formalLessonIds.has(currentLessonId)) {
    return false;
  }

  const prerequisiteIds = new Set<string>();
  for (const lesson of basePassageLessons) {
    if (!formalLessonIds.has(lesson.id)) {
      return false;
    }
    prerequisiteIds.add(lesson.id);
  }

  for (const sentence of customSentences) {
    if (sentence.lessonId !== undefined) {
      if (!sentence.lessonId || !formalLessonIds.has(sentence.lessonId)) {
        return false;
      }
      prerequisiteIds.add(sentence.lessonId);
    }
  }

  return [...prerequisiteIds].every(
    (lessonId) =>
      lessonId === currentLessonId || completedLessonIds.includes(lessonId),
  );
};

const sentenceDifference = (actualSentence: string, expectedSentence: string) => {
  const actual = normalizeSentence(actualSentence).split(" ").filter(Boolean);
  const expected = normalizeSentence(expectedSentence).split(" ").filter(Boolean);
  const mismatch = expected.findIndex(
    (word, index) => actual[index] !== word,
  );

  if (mismatch < 0 && actual.length > expected.length) {
    return `多輸入了 ${actual.length - expected.length} 個單字。`;
  }
  if (mismatch < 0) return "";
  if (!actual[mismatch]) return `第 ${mismatch + 1} 個位置缺少單字。`;
  return `第 ${mismatch + 1} 個位置需要再檢查（你輸入：${actual[mismatch]}）。`;
};

export const evaluatePassageRebuild = (
  values: string[],
  lessons: Lesson[],
): PassageSentenceEvaluation[] =>
  lessons.map((lesson, index) => {
    const value = values[index] ?? "";
    const correct =
      normalizeSentence(value) === normalizeSentence(lesson.sentence);
    return {
      sentenceId: lesson.sentenceId,
      correct,
      message: correct
        ? "本句正確"
        : sentenceDifference(value, lesson.sentence),
      expected: lesson.sentence,
    };
  });

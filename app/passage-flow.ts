import type { Lesson } from "./course-data";

export type PassageSentenceEvaluation = {
  sentenceId: string;
  correct: boolean;
  message: string;
  expected: string;
};

const normalizeSentence = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?。！？]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

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

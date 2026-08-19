export type CrossInputNavigation = "previous-end" | "next-start" | null;

export interface CrossInputNavigationState {
  key: string;
  valueLength: number;
  selectionStart: number;
  selectionEnd: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const resolveCrossInputNavigation = ({
  key,
  valueLength,
  selectionStart,
  selectionEnd,
  hasPrevious,
  hasNext,
}: CrossInputNavigationState): CrossInputNavigation => {
  if (
    key === "ArrowLeft" &&
    selectionStart === 0 &&
    selectionEnd === 0 &&
    hasPrevious
  ) {
    return "previous-end";
  }

  if (
    key === "ArrowRight" &&
    selectionStart === valueLength &&
    selectionEnd === valueLength &&
    hasNext
  ) {
    return "next-start";
  }

  if (key === "Backspace" && valueLength === 0 && hasPrevious) {
    return "previous-end";
  }

  return null;
};

const normalizeRecallAnswer = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();

const editDistance = (a: string, b: string) => {
  const rows = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
};

const answerLengthPattern = (answer: string) =>
  answer
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z]/gi, "").length)
    .join("－");

export interface RecallIncorrectFeedback {
  message: string;
  revealAnswer: boolean;
  replayAudio: boolean;
}

export const recallIncorrectFeedback = (
  attemptedAnswer: string,
  expectedAnswer: string,
  nextAttempt: number,
): RecallIncorrectFeedback => {
  if (nextAttempt >= 3) {
    return {
      message: `正確答案是 ${expectedAnswer}。請重新輸入一次。`,
      revealAnswer: true,
      replayAudio: false,
    };
  }

  const attempted = normalizeRecallAnswer(attemptedAnswer);
  const expected = normalizeRecallAnswer(expectedAnswer);
  const nearMiss =
    attempted.length > 1 && editDistance(attempted, expected) <= 2;
  const nearMissMessage = nearMiss ? "拼字很接近。\n" : "";

  if (nextAttempt === 1) {
    return {
      message: `${nearMissMessage}字母數：${answerLengthPattern(expectedAnswer)}`,
      revealAnswer: false,
      replayAudio: false,
    };
  }

  return {
    message: `${nearMissMessage}第一個字母：${expectedAnswer.trim()[0]}`,
    revealAnswer: false,
    replayAudio: true,
  };
};

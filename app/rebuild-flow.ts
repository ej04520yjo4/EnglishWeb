export type RebuildStatus =
  | ""
  | "correct"
  | "order"
  | "spelling"
  | "missing"
  | "revealed";

export type RebuildEvaluation = {
  attempts: number;
  correct: boolean;
  revealed: boolean;
  statuses: RebuildStatus[];
  displayValues: string[];
};

const normalizeWord = (value: string) =>
  value.trim().toLowerCase().replace(/[.,!?]/g, "");

export const evaluateRebuildAttempt = (
  enteredValues: string[],
  expectedValues: string[],
  previousAttempts: number,
  maximumAttempts = 3,
): RebuildEvaluation => {
  const normalizedAnswers = expectedValues.map(normalizeWord);
  const normalizedValues = enteredValues.map(normalizeWord);
  const statuses = Array.from(
    { length: Math.max(normalizedValues.length, normalizedAnswers.length) },
    (_, index): RebuildStatus => {
      const value = normalizedValues[index] ?? "";
      if (index >= normalizedAnswers.length) return "spelling";
      if (!value) return "missing";
      if (value === normalizedAnswers[index]) return "correct";
      if (normalizedAnswers.includes(value)) return "order";
      return "spelling";
    },
  );
  const correct = normalizedAnswers.length > 0 &&
    normalizedValues.length === normalizedAnswers.length &&
    statuses.every((status) => status === "correct");

  if (correct) {
    return {
      attempts: previousAttempts,
      correct: true,
      revealed: false,
      statuses,
      displayValues: enteredValues,
    };
  }

  const attempts = previousAttempts + 1;
  const revealed = attempts >= maximumAttempts;
  return {
    attempts,
    correct: false,
    revealed,
    statuses: revealed
      ? expectedValues.map(() => "revealed")
      : statuses,
    displayValues: revealed ? expectedValues : enteredValues,
  };
};

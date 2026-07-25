const normalizeSentence = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?。！？]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

export const wordAccuracy = (given: string, expected: string) => {
  const actualWords = normalizeSentence(given).split(" ").filter(Boolean);
  const expectedWords = normalizeSentence(expected).split(" ").filter(Boolean);
  const comparedLength = Math.max(actualWords.length, expectedWords.length);
  if (comparedLength === 0) return 0;

  let correct = 0;
  for (let index = 0; index < comparedLength; index += 1) {
    if (
      index < expectedWords.length &&
      actualWords[index] === expectedWords[index]
    ) {
      correct += 1;
    }
  }
  return Math.round((correct / comparedLength) * 100);
};

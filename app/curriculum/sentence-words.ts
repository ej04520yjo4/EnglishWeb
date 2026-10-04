// Spelling units stay separate from sentence punctuation and compound hyphens.
// Keep this projection independent of learner input: unknown input must not be
// silently discarded when an answer is graded.
export const sentenceSpellingUnits = (sentence: string): string[] =>
  sentence.replace(/[’‘]/g, "'").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];

export const hasSupportedSentenceCharacters = (sentence: string) =>
  /^[A-Za-z\s'’‘.,!?;:\-–—]+$/.test(sentence);

export const normalizeSentenceForComparison = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?。！？]+$/g, "")
    .replace(/[,;:\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

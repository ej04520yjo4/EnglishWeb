import type { A1CourseCsvRow } from "./a1-mvp-data";

export const A1_PATTERN_EXERCISES_URL =
  "/data/a1-pattern-exercises.json";
export const A1_READING_EXERCISES_URL =
  "/data/a1-reading-exercises.json";

export type PatternSlot = {
  slotId: string;
  role: string;
  allowedLexemeIds: string[];
  allowedChunkIds?: string[];
  restrictions?: string[];
};

export type PatternExample = {
  id: string;
  lessonId: string;
  sourceSentenceId: string;
  sentencePatternId: string;
  passageId: string;
  sentence: string;
  translation: string;
  hintKeywords: string;
  skeleton: string;
  requiredLexemeIds: string[];
  requiredChunkIds: string[];
};

export type SentencePattern = {
  id: string;
  cefr: "A1" | "A2";
  template: string;
  slots: PatternSlot[];
  examples: PatternExample[];
};

export type PatternExerciseData = {
  schemaVersion: number;
  patterns: SentencePattern[];
};

export type ExerciseOption = {
  id: string;
  text: string;
  sourceSentenceId?: string;
  requiredLexemeIds?: string[];
};

export type ReadingRecognitionExercise = {
  id: string;
  lessonId: string;
  sentenceId: string;
  sentencePatternId: string;
  passageId: string;
  type:
    | "english-to-chinese"
    | "chinese-to-english"
    | "true-false";
  instruction: string;
  stem: string;
  options: ExerciseOption[];
  correctOptionId: string;
};

export type TextResponseExercise = {
  id: string;
  lessonId: string;
  sourceSentenceId: string;
  sentencePatternId: string;
  passageId: string;
  promptLanguage: "zh-Hant" | "en";
  prompt: string;
  format: "choice" | "text";
  options: ExerciseOption[];
  correctOptionId: string;
};

export type PassageComprehensionQuestion = {
  id: string;
  sourceSentenceId: string;
  questionLanguage: "zh-Hant" | "en";
  question: string;
  options: string[];
  correctAnswer: string;
};

export type PassageComprehensionExercise = {
  passageId: string;
  questions: PassageComprehensionQuestion[];
};

export type ReadingExerciseData = {
  schemaVersion: number;
  recognition: ReadingRecognitionExercise[];
  textResponses: TextResponseExercise[];
  passages: PassageComprehensionExercise[];
};

export type A1ExerciseData = {
  patterns: PatternExerciseData;
  reading: ReadingExerciseData;
};

export type ExerciseValidationReport = {
  valid: boolean;
  errors: string[];
};

const lessonRank = (lessonId: string) => {
  const match = lessonId.match(/^a1-u(\d+)-l(\d+)$/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number(match[1]) * 100 + Number(match[2]);
};

const normalizeSentence = (value: string) =>
  value
    .trim()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?。！？]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

const sentenceWordCount = (value: string) =>
  normalizeSentence(value).split(" ").filter(Boolean).length;

export const learnedLexemeIdsThroughLesson = (
  rows: A1CourseCsvRow[],
  lessonId: string,
) =>
  new Set(
    rows
      .filter((row) => lessonRank(row.lesson_id) <= lessonRank(lessonId))
      .map((row) => row.lexeme_id),
  );

const learnedSentenceIdsThroughLesson = (
  rows: A1CourseCsvRow[],
  lessonId: string,
) =>
  new Set(
    rows
      .filter((row) => lessonRank(row.lesson_id) <= lessonRank(lessonId))
      .map((row) => row.sentence_id),
  );

export const validatePatternExerciseData = (
  data: PatternExerciseData,
  rows: A1CourseCsvRow[],
): ExerciseValidationReport => {
  const errors: string[] = [];
  const patternIds = new Set<string>();
  const rowsByLesson = new Map<string, A1CourseCsvRow[]>();
  rows.forEach((row) => {
    const current = rowsByLesson.get(row.lesson_id) ?? [];
    current.push(row);
    rowsByLesson.set(row.lesson_id, current);
  });

  for (const pattern of data.patterns) {
    if (patternIds.has(pattern.id)) {
      errors.push(`句型 ID 重複：${pattern.id}`);
    }
    patternIds.add(pattern.id);
    if (pattern.cefr !== "A1") {
      errors.push(`${pattern.id} 目前只能使用 A1 題目。`);
    }
    if (!pattern.examples.length) {
      errors.push(`${pattern.id} 至少需要一個合法變化題。`);
    }
    for (const example of pattern.examples) {
      const sourceRows = rowsByLesson.get(example.lessonId) ?? [];
      const source = sourceRows[0];
      if (!source) {
        errors.push(`${example.id} 找不到來源課程 ${example.lessonId}。`);
        continue;
      }
      if (source.sentence_pattern_id !== pattern.id) {
        errors.push(
          `${example.id} 未引用來源課程的 sentence_pattern_id。`,
        );
      }
      if (
        example.sourceSentenceId !== source.sentence_id ||
        example.sentencePatternId !== source.sentence_pattern_id ||
        example.passageId !== source.passage_id
      ) {
        errors.push(`${example.id} 的正式課程引用不一致。`);
      }
      if (
        normalizeSentence(example.sentence) ===
        normalizeSentence(source.sentence)
      ) {
        errors.push(`${example.id} 不可與原句完全相同。`);
      }
      if (sentenceWordCount(example.sentence) > 8) {
        errors.push(`${example.id} 超過 A1 的 8 字限制。`);
      }
      const learnedLexemes = learnedLexemeIdsThroughLesson(
        rows,
        example.lessonId,
      );
      const unlearned = example.requiredLexemeIds.filter(
        (lexemeId) => !learnedLexemes.has(lexemeId),
      );
      if (unlearned.length) {
        errors.push(
          `${example.id} 使用尚未教過的 lexeme：${unlearned.join("、")}。`,
        );
      }
      const learnedChunks = new Set(
        rows
          .filter(
            (row) =>
              lessonRank(row.lesson_id) <= lessonRank(example.lessonId),
          )
          .map((row) => row.chunk_id)
          .filter(Boolean),
      );
      const unlearnedChunks = example.requiredChunkIds.filter(
        (chunkId) => !learnedChunks.has(chunkId),
      );
      if (unlearnedChunks.length) {
        errors.push(
          `${example.id} 使用尚未教過的 chunk：${unlearnedChunks.join("、")}。`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

export const validateReadingExerciseData = (
  data: ReadingExerciseData,
  rows: A1CourseCsvRow[],
): ExerciseValidationReport => {
  const errors: string[] = [];
  const rowsBySentence = new Map(
    rows.map((row) => [row.sentence_id, row]),
  );

  for (const exercise of data.recognition) {
    const source = rowsBySentence.get(exercise.sentenceId);
    const optionIds = new Set(exercise.options.map((option) => option.id));
    const optionTexts = exercise.options.map((option) =>
      normalizeSentence(option.text),
    );
    if (!source || source.lesson_id !== exercise.lessonId) {
      errors.push(`${exercise.id} 找不到正式來源句。`);
      continue;
    }
    if (
      exercise.sentencePatternId !== source.sentence_pattern_id ||
      exercise.passageId !== source.passage_id
    ) {
      errors.push(`${exercise.id} 的句型或文章引用不一致。`);
    }
    if (!optionIds.has(exercise.correctOptionId)) {
      errors.push(`${exercise.id} 缺少正確選項。`);
    }
    if (new Set(optionTexts).size !== optionTexts.length) {
      errors.push(`${exercise.id} 的干擾選項不可等於正確答案。`);
    }
    const learnedSentenceIds = learnedSentenceIdsThroughLesson(
      rows,
      exercise.lessonId,
    );
    const earlyDistractor = exercise.options.find(
      (option) =>
        option.sourceSentenceId &&
        !learnedSentenceIds.has(option.sourceSentenceId),
    );
    if (earlyDistractor) {
      errors.push(
        `${exercise.id} 的選項提前使用 ${earlyDistractor.sourceSentenceId}。`,
      );
    }
  }

  for (const exercise of data.textResponses) {
    const source = rowsBySentence.get(exercise.sourceSentenceId);
    if (
      !source ||
      source.lesson_id !== exercise.lessonId ||
      source.sentence_pattern_id !== exercise.sentencePatternId ||
      source.passage_id !== exercise.passageId
    ) {
      errors.push(`${exercise.id} 的正式課程引用不一致。`);
      continue;
    }
    const learnedLexemes = learnedLexemeIdsThroughLesson(
      rows,
      exercise.lessonId,
    );
    if (
      !exercise.options.some(
        (option) => option.id === exercise.correctOptionId,
      )
    ) {
      errors.push(`${exercise.id} 缺少正確答案。`);
    }
    for (const option of exercise.options) {
      const unlearned = (option.requiredLexemeIds ?? []).filter(
        (lexemeId) => !learnedLexemes.has(lexemeId),
      );
      if (unlearned.length) {
        errors.push(
          `${exercise.id} 提前使用 lexeme：${unlearned.join("、")}。`,
        );
      }
    }
  }

  for (const passage of data.passages) {
    const passageRows = rows.filter(
      (row) => row.passage_id === passage.passageId,
    );
    const passageSentenceIds = new Set(
      passageRows.map((row) => row.sentence_id),
    );
    for (const question of passage.questions) {
      const source = rowsBySentence.get(question.sourceSentenceId);
      if (
        !source ||
        !passageSentenceIds.has(question.sourceSentenceId)
      ) {
        errors.push(
          `${question.id} 未引用 ${passage.passageId} 的正式句子。`,
        );
        continue;
      }
      if (!question.options.includes(question.correctAnswer)) {
        errors.push(`${question.id} 的答案不在選項中。`);
      }
      if (new Set(question.options).size !== question.options.length) {
        errors.push(`${question.id} 的選項不可重複。`);
      }
      const answerPhrase = normalizeSentence(
        question.correctAnswer,
      );
      if (!normalizeSentence(source.sentence).includes(answerPhrase)) {
        errors.push(
          `${question.id} 的答案與來源文章不一致。`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

export const loadA1ExerciseData = async (
  fetcher: typeof fetch = fetch,
): Promise<A1ExerciseData> => {
  const [patternResponse, readingResponse] = await Promise.all([
    fetcher(A1_PATTERN_EXERCISES_URL, { cache: "no-store" }),
    fetcher(A1_READING_EXERCISES_URL, { cache: "no-store" }),
  ]);
  if (!patternResponse.ok || !readingResponse.ok) {
    throw new Error("A1 文字練習資料載入失敗。");
  }
  return {
    patterns: (await patternResponse.json()) as PatternExerciseData,
    reading: (await readingResponse.json()) as ReadingExerciseData,
  };
};

export const patternExamplesForLesson = (
  data: PatternExerciseData,
  lessonId: string,
) =>
  data.patterns
    .flatMap((pattern) => pattern.examples)
    .filter((example) => example.lessonId === lessonId);

export const recognitionForLesson = (
  data: ReadingExerciseData,
  lessonId: string,
) =>
  data.recognition.find((exercise) => exercise.lessonId === lessonId);

export const textResponseForLesson = (
  data: ReadingExerciseData,
  lessonId: string,
) =>
  data.textResponses.find((exercise) => exercise.lessonId === lessonId);

export const comprehensionForPassage = (
  data: ReadingExerciseData,
  passageId: string,
) =>
  data.passages.find((exercise) => exercise.passageId === passageId);

export const isPatternTransferCorrect = (
  answer: string,
  example: PatternExample,
) =>
  normalizeSentence(answer) === normalizeSentence(example.sentence);

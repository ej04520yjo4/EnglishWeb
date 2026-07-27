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
  practiceLessonId: string;
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
  enabledForTransfer: boolean;
  deferReason?: string;
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
  requiredChunkIds?: string[];
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
  requiredLexemeIds: string[];
  requiredChunkIds: string[];
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
  targetTranslation: string;
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

export type PatternCoverageSummary = {
  csvPatternCount: number;
  enabledPatternCount: number;
  exercisedPatternCount: number;
  uncoveredPatternIds: string[];
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

export const learnedChunkIdsThroughLesson = (
  rows: A1CourseCsvRow[],
  lessonId: string,
) =>
  new Set(
    rows
      .filter((row) => lessonRank(row.lesson_id) <= lessonRank(lessonId))
      .map((row) => row.chunk_id)
      .filter(Boolean),
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

export const patternCoverageSummary = (
  data: PatternExerciseData,
  rows: A1CourseCsvRow[],
): PatternCoverageSummary => {
  const csvPatternIds = Array.from(
    new Set(rows.map((row) => row.sentence_pattern_id)),
  ).sort();
  const configuredById = new Map(
    data.patterns.map((pattern) => [pattern.id, pattern]),
  );
  const enabledPatternIds = csvPatternIds.filter(
    (patternId) =>
      configuredById.get(patternId)?.enabledForTransfer === true,
  );
  const exercisedPatternIds = enabledPatternIds.filter(
    (patternId) =>
      (configuredById.get(patternId)?.examples.length ?? 0) > 0,
  );
  return {
    csvPatternCount: csvPatternIds.length,
    enabledPatternCount: enabledPatternIds.length,
    exercisedPatternCount: exercisedPatternIds.length,
    uncoveredPatternIds: csvPatternIds.filter(
      (patternId) =>
        (configuredById.get(patternId)?.examples.length ?? 0) === 0,
    ),
  };
};

const validateReferencedLexemes = (
  sentence: string,
  requiredLexemeIds: string[],
  learnedRows: A1CourseCsvRow[],
  label: string,
) => {
  const errors: string[] = [];
  const required = new Set(requiredLexemeIds);
  const used = new Set<string>();
  const lexemesByAnswer = new Map<string, Set<string>>();
  learnedRows.forEach((row) => {
    const answer = normalizeSentence(row.answer);
    const current = lexemesByAnswer.get(answer) ?? new Set<string>();
    current.add(row.lexeme_id);
    lexemesByAnswer.set(answer, current);
  });
  for (const word of normalizeSentence(sentence).split(" ").filter(Boolean)) {
    const candidates = lexemesByAnswer.get(word);
    const matched = candidates
      ? Array.from(candidates).find((lexemeId) => required.has(lexemeId))
      : undefined;
    if (!matched) {
      errors.push(`${label} 的「${word}」沒有合法的已學 lexeme 引用。`);
      continue;
    }
    used.add(matched);
  }
  const unused = requiredLexemeIds.filter(
    (lexemeId) => !used.has(lexemeId),
  );
  if (unused.length) {
    errors.push(
      `${label} 宣告但未使用 lexeme：${unused.join("、")}。`,
    );
  }
  return errors;
};

export const validatePatternExerciseData = (
  data: PatternExerciseData,
  rows: A1CourseCsvRow[],
): ExerciseValidationReport => {
  const errors: string[] = [];
  const patternIds = new Set<string>();
  const exampleIds = new Set<string>();
  const csvPatternIds = new Set(
    rows.map((row) => row.sentence_pattern_id),
  );
  const rowsBySentence = new Map(
    rows.map((row) => [row.sentence_id, row]),
  );

  for (const pattern of data.patterns) {
    if (patternIds.has(pattern.id)) {
      errors.push(`句型 ID 重複：${pattern.id}`);
    }
    patternIds.add(pattern.id);
    if (!csvPatternIds.has(pattern.id)) {
      errors.push(`句型 ${pattern.id} 不存在於正式 CSV。`);
    }
    if (pattern.cefr !== "A1") {
      errors.push(`${pattern.id} 目前只能使用 A1 題目。`);
    }
    if (typeof pattern.enabledForTransfer !== "boolean") {
      errors.push(
        `${pattern.id} 必須明確設定 enabledForTransfer 為 true 或 false。`,
      );
    }
    if (pattern.enabledForTransfer && !pattern.examples.length) {
      errors.push(`${pattern.id} 至少需要一個合法變化題。`);
    }
    if (!pattern.enabledForTransfer && pattern.examples.length) {
      errors.push(`${pattern.id} 尚未啟用，不可放入換字題。`);
    }
    for (const example of pattern.examples) {
      if (exampleIds.has(example.id)) {
        errors.push(`變化題 ID 重複：${example.id}`);
      }
      exampleIds.add(example.id);
      const source = rowsBySentence.get(example.sourceSentenceId);
      if (!source) {
        errors.push(
          `${example.id} 找不到來源句 ${example.sourceSentenceId}。`,
        );
        continue;
      }
      if (source.sentence_pattern_id !== pattern.id) {
        errors.push(
          `${example.id} 未引用來源課程的 sentence_pattern_id。`,
        );
      }
      if (
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
        example.practiceLessonId,
      );
      const unlearned = example.requiredLexemeIds.filter(
        (lexemeId) => !learnedLexemes.has(lexemeId),
      );
      if (unlearned.length) {
        errors.push(
          `${example.id} 使用尚未教過的 lexeme：${unlearned.join("、")}。`,
        );
      }
      const learnedRows = rows.filter(
        (row) =>
          lessonRank(row.lesson_id) <=
          lessonRank(example.practiceLessonId),
      );
      errors.push(
        ...validateReferencedLexemes(
          example.sentence,
          example.requiredLexemeIds,
          learnedRows,
          example.id,
        ),
      );
      const learnedChunks = learnedChunkIdsThroughLesson(
        rows,
        example.practiceLessonId,
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
  for (const csvPatternId of csvPatternIds) {
    if (!patternIds.has(csvPatternId)) {
      errors.push(`正式 CSV 句型尚未設定啟用狀態：${csvPatternId}`);
    }
  }

  return { valid: errors.length === 0, errors };
};

export const validateReadingExerciseData = (
  data: ReadingExerciseData,
  rows: A1CourseCsvRow[],
  patternData?: PatternExerciseData,
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
    if (
      !source ||
      lessonRank(source.lesson_id) > lessonRank(exercise.lessonId)
    ) {
      errors.push(`${exercise.id} 找不到正式來源句。`);
      continue;
    }
    if (
      exercise.sentencePatternId !== source.sentence_pattern_id ||
      exercise.passageId !== source.passage_id
    ) {
      errors.push(`${exercise.id} 的句型或文章引用不一致。`);
    }
    if (
      normalizeSentence(exercise.stem) !==
      normalizeSentence(source.sentence)
    ) {
      errors.push(`${exercise.id} 的題幹與正式來源句不一致。`);
    }
    const learnedRows = rows.filter(
      (row) =>
        lessonRank(row.lesson_id) <= lessonRank(exercise.lessonId),
    );
    const learnedLexemes = learnedLexemeIdsThroughLesson(
      rows,
      exercise.lessonId,
    );
    const earlyLexemes = exercise.requiredLexemeIds.filter(
      (lexemeId) => !learnedLexemes.has(lexemeId),
    );
    if (earlyLexemes.length) {
      errors.push(
        `${exercise.id} 提前使用 lexeme：${earlyLexemes.join("、")}。`,
      );
    }
    errors.push(
      ...validateReferencedLexemes(
        exercise.stem,
        exercise.requiredLexemeIds,
        learnedRows,
        exercise.id,
      ),
    );
    const learnedChunks = learnedChunkIdsThroughLesson(
      rows,
      exercise.lessonId,
    );
    const earlyChunks = exercise.requiredChunkIds.filter(
      (chunkId) => !learnedChunks.has(chunkId),
    );
    if (earlyChunks.length) {
      errors.push(
        `${exercise.id} 提前使用 chunk：${earlyChunks.join("、")}。`,
      );
    }
    if (!optionIds.has(exercise.correctOptionId)) {
      errors.push(`${exercise.id} 缺少正確選項。`);
    }
    if (new Set(optionTexts).size !== optionTexts.length) {
      errors.push(`${exercise.id} 的干擾選項不可等於正確答案。`);
    }
    const correctOption = exercise.options.find(
      (option) => option.id === exercise.correctOptionId,
    );
    if (
      exercise.type === "english-to-chinese" &&
      correctOption?.text !== source.translation
    ) {
      errors.push(`${exercise.id} 的中文答案與正式翻譯不一致。`);
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
      lessonRank(source.lesson_id) > lessonRank(exercise.lessonId) ||
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
    const correctOption = exercise.options.find(
      (option) => option.id === exercise.correctOptionId,
    );
    const knownTranslations = new Map<string, string>();
    rows.forEach((row) => {
      knownTranslations.set(
        normalizeSentence(row.sentence),
        row.translation,
      );
    });
    patternData?.patterns.forEach((pattern) =>
      pattern.examples.forEach((example) => {
        knownTranslations.set(
          normalizeSentence(example.sentence),
          example.translation,
        );
      }),
    );
    const expectedTranslation = correctOption
      ? knownTranslations.get(normalizeSentence(correctOption.text))
      : undefined;
    if (
      !expectedTranslation ||
      expectedTranslation !== exercise.targetTranslation ||
      !exercise.prompt.includes(
        exercise.targetTranslation.replace(/[。！？.!?]+$/g, ""),
      )
    ) {
      errors.push(`${exercise.id} 的中英文人稱或目標意思不一致。`);
    }
    const learnedRows = rows.filter(
      (row) =>
        lessonRank(row.lesson_id) <= lessonRank(exercise.lessonId),
    );
    const learnedChunks = learnedChunkIdsThroughLesson(
      rows,
      exercise.lessonId,
    );
    for (const option of exercise.options) {
      const unlearned = (option.requiredLexemeIds ?? []).filter(
        (lexemeId) => !learnedLexemes.has(lexemeId),
      );
      if (unlearned.length) {
        errors.push(
          `${exercise.id} 提前使用 lexeme：${unlearned.join("、")}。`,
        );
      }
      errors.push(
        ...validateReferencedLexemes(
          option.text,
          option.requiredLexemeIds ?? [],
          learnedRows,
          `${exercise.id}/${option.id}`,
        ),
      );
      const unlearnedChunks = (
        option.requiredChunkIds ?? []
      ).filter((chunkId) => !learnedChunks.has(chunkId));
      if (unlearnedChunks.length) {
        errors.push(
          `${exercise.id} 提前使用 chunk：${unlearnedChunks.join("、")}。`,
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
    .filter((example) => example.practiceLessonId === lessonId);

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

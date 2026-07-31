import type { CourseCsvRow } from "./curriculum/types";
import type { CefrLevel } from "./curriculum/types";

export type PatternSlot = {
  slotId: string;
  role: string;
  allowedLexemeIds: string[];
  allowedChunkIds?: string[];
  restrictions?: string[];
};

export type PatternSlotValue = {
  slotId: string;
  text: string;
  requiredLexemeIds: string[];
  requiredChunkIds?: string[];
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
  slotValues?: PatternSlotValue[];
  qaStatus?: string;
};

export type SentencePattern = {
  id: string;
  cefr: CefrLevel;
  enabledForTransfer: boolean;
  deferReason?: string;
  template: string;
  slots: PatternSlot[];
  examples: PatternExample[];
  qaStatus?: string;
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
  qaStatus?: string;
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
  qaStatus?: string;
};

export type PassageComprehensionQuestion = {
  id: string;
  sourceSentenceId: string;
  questionLanguage: "zh-Hant" | "en";
  question: string;
  options: string[];
  optionMetadata?: PassageQuestionOptionMetadata[];
  correctAnswer: string;
  evidenceSentenceIds?: string[];
  qaStatus?: string;
};

export type PassageQuestionOptionMetadata = {
  text: string;
  requiredLexemeIds: string[];
  requiredChunkIds?: string[];
};

export type PassageSentence = {
  id: string;
  order: number;
  sentence: string;
  translation: string;
  lessonId?: string;
  requiredLexemeIds?: string[];
  requiredChunkIds?: string[];
  qaStatus?: string;
};

export type PassageComprehensionExercise = {
  passageId: string;
  sentences?: PassageSentence[];
  questions: PassageComprehensionQuestion[];
  level?: CefrLevel;
  qaStatus?: string;
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

export type CourseExerciseData = A1ExerciseData;

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
  const match = lessonId.match(/^(a1|a2|b1|b2)-u(\d+)-l(\d+)$/);
  if (!match) return -1;
  const levelRank = {
    a1: 0,
    a2: 100000,
    b1: 200000,
    b2: 300000,
  }[match[1]]!;
  return levelRank + Number(match[2]) * 100 + Number(match[3]);
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

const sameStringSet = (left: string[], right: string[]) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return (
    leftSet.size === rightSet.size &&
    Array.from(leftSet).every((value) => rightSet.has(value))
  );
};

export const learnedLexemeIdsThroughLesson = (
  rows: CourseCsvRow[],
  lessonId: string,
) =>
  new Set(
    rows
      .filter((row) => lessonRank(row.lesson_id) <= lessonRank(lessonId))
      .map((row) => row.lexeme_id),
  );

export const learnedChunkIdsThroughLesson = (
  rows: CourseCsvRow[],
  lessonId: string,
) =>
  new Set(
    rows
      .filter((row) => lessonRank(row.lesson_id) <= lessonRank(lessonId))
      .map((row) => row.chunk_id)
      .filter(Boolean),
  );

const learnedSentenceIdsThroughLesson = (
  rows: CourseCsvRow[],
  lessonId: string,
) =>
  new Set(
    rows
      .filter((row) => lessonRank(row.lesson_id) <= lessonRank(lessonId))
      .map((row) => row.sentence_id),
  );

export const patternCoverageSummary = (
  data: PatternExerciseData,
  rows: CourseCsvRow[],
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
  learnedRows: CourseCsvRow[],
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
  rows: CourseCsvRow[],
  expectedLevel: CefrLevel = "A1",
  prerequisiteRows: CourseCsvRow[] = [],
): ExerciseValidationReport => {
  const errors: string[] = [];
  const patternIds = new Set<string>();
  const exampleIds = new Set<string>();
  const csvPatternIds = new Set(
    rows.map((row) => row.sentence_pattern_id),
  );
  const lessonIds = new Set(rows.map((row) => row.lesson_id));
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
    if (pattern.cefr !== expectedLevel) {
      errors.push(`${pattern.id} 必須標記為 ${expectedLevel} 題目。`);
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
    const allowedLexemeIds = new Set(
      pattern.slots.flatMap((slot) => slot.allowedLexemeIds),
    );
    const allowedChunkIds = new Set(
      pattern.slots.flatMap(
        (slot) => slot.allowedChunkIds ?? [],
      ),
    );
    for (const example of pattern.examples) {
      if (exampleIds.has(example.id)) {
        errors.push(`變化題 ID 重複：${example.id}`);
      }
      exampleIds.add(example.id);
      const practiceLessonExists = lessonIds.has(
        example.practiceLessonId,
      );
      if (!practiceLessonExists) {
        errors.push(
          `${example.id} 找不到正式練習課程 ${example.practiceLessonId}。`,
        );
      }
      const source = rowsBySentence.get(example.sourceSentenceId);
      if (!source) {
        errors.push(
          `${example.id} 找不到來源句 ${example.sourceSentenceId}。`,
        );
      }
      if (!practiceLessonExists || !source) {
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
      const wordLimit = {
        A1: 8,
        A2: 10,
        B1: 16,
        B2: 22,
      }[expectedLevel];
      if (sentenceWordCount(example.sentence) > wordLimit) {
        errors.push(
          `${example.id} 超過 ${expectedLevel} 的 ${wordLimit} 字限制。`,
        );
      }
      const disallowedLexemes = example.requiredLexemeIds.filter(
        (lexemeId) => !allowedLexemeIds.has(lexemeId),
      );
      if (disallowedLexemes.length) {
        errors.push(
          `${example.id} 的 requiredLexemeIds 不符合 ${pattern.id} slot allowedLexemeIds：${disallowedLexemes.join("、")}。`,
        );
      }
      const disallowedChunks = example.requiredChunkIds.filter(
        (chunkId) => !allowedChunkIds.has(chunkId),
      );
      if (disallowedChunks.length) {
        errors.push(
          `${example.id} 的 requiredChunkIds 不符合 ${pattern.id} slot allowedChunkIds：${disallowedChunks.join("、")}。`,
        );
      }
      const availableRows = [...prerequisiteRows, ...rows];
      const learnedLexemes = learnedLexemeIdsThroughLesson(
        availableRows,
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
      const learnedRows = availableRows.filter(
        (row) =>
          lessonRank(row.lesson_id) <=
          lessonRank(example.practiceLessonId),
      );
      if (example.slotValues?.length) {
        const slotValuesById = new Map(
          example.slotValues.map((value) => [value.slotId, value]),
        );
        if (slotValuesById.size !== example.slotValues.length) {
          errors.push(`${example.id} 的 slotValues 不可重複 slotId。`);
        }
        const unknownSlotIds = example.slotValues
          .map((value) => value.slotId)
          .filter(
            (slotId) =>
              !pattern.slots.some((slot) => slot.slotId === slotId),
          );
        if (unknownSlotIds.length) {
          errors.push(
            `${example.id} 使用不存在的 slot：${unknownSlotIds.join("、")}。`,
          );
        }
        const missingSlotIds = pattern.slots
          .map((slot) => slot.slotId)
          .filter((slotId) => !slotValuesById.has(slotId));
        if (missingSlotIds.length) {
          errors.push(
            `${example.id} 缺少 slot：${missingSlotIds.join("、")}。`,
          );
        }
        const rebuilt = pattern.slots
          .map((slot) => slotValuesById.get(slot.slotId)?.text ?? "")
          .join(" ");
        if (
          normalizeSentence(rebuilt) !==
          normalizeSentence(example.sentence)
        ) {
          errors.push(`${example.id} 的 slotValues 無法重建變化句。`);
        }
        const slotLexemeIds: string[] = [];
        const slotChunkIds: string[] = [];
        for (const value of example.slotValues) {
          const slot = pattern.slots.find(
            (candidate) => candidate.slotId === value.slotId,
          );
          if (!slot) continue;
          const invalidLexemes = value.requiredLexemeIds.filter(
            (lexemeId) => !slot.allowedLexemeIds.includes(lexemeId),
          );
          if (invalidLexemes.length) {
            errors.push(
              `${example.id}/${value.slotId} 使用不允許的 lexeme：${invalidLexemes.join("、")}。`,
            );
          }
          const invalidChunks = (value.requiredChunkIds ?? []).filter(
            (chunkId) => !(slot.allowedChunkIds ?? []).includes(chunkId),
          );
          if (invalidChunks.length) {
            errors.push(
              `${example.id}/${value.slotId} 使用不允許的 chunk：${invalidChunks.join("、")}。`,
            );
          }
          errors.push(
            ...validateReferencedLexemes(
              value.text,
              value.requiredLexemeIds,
              learnedRows,
              `${example.id}/${value.slotId}`,
            ),
          );
          slotLexemeIds.push(...value.requiredLexemeIds);
          slotChunkIds.push(...(value.requiredChunkIds ?? []));
        }
        if (
          !sameStringSet(slotLexemeIds, example.requiredLexemeIds)
        ) {
          errors.push(
            `${example.id} 的 slotValues lexeme 與 requiredLexemeIds 不一致。`,
          );
        }
        if (!sameStringSet(slotChunkIds, example.requiredChunkIds)) {
          errors.push(
            `${example.id} 的 slotValues chunk 與 requiredChunkIds 不一致。`,
          );
        }
      }
      errors.push(
        ...validateReferencedLexemes(
          example.sentence,
          example.requiredLexemeIds,
          learnedRows,
          example.id,
        ),
      );
      const learnedChunks = learnedChunkIdsThroughLesson(
        availableRows,
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
  rows: CourseCsvRow[],
  patternData?: PatternExerciseData,
  prerequisiteRows: CourseCsvRow[] = [],
): ExerciseValidationReport => {
  const errors: string[] = [];
  const availableRows = [...prerequisiteRows, ...rows];
  const lessonIds = new Set(rows.map((row) => row.lesson_id));
  const rowsBySentence = new Map(
    rows.map((row) => [row.sentence_id, row]),
  );

  for (const exercise of data.recognition) {
    const source = rowsBySentence.get(exercise.sentenceId);
    const optionIds = new Set(exercise.options.map((option) => option.id));
    const optionTexts = exercise.options.map((option) =>
      normalizeSentence(option.text),
    );
    const lessonExists = lessonIds.has(exercise.lessonId);
    if (!lessonExists) {
      errors.push(
        `${exercise.id} 找不到正式練習課程 ${exercise.lessonId}。`,
      );
    }
    if (!source) {
      errors.push(
        `${exercise.id} 找不到正式來源句 ${exercise.sentenceId}。`,
      );
    }
    if (!lessonExists || !source) {
      continue;
    }
    if (lessonRank(source.lesson_id) > lessonRank(exercise.lessonId)) {
      errors.push(`${exercise.id} 的來源句尚未在練習課程前教過。`);
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
    const learnedRows = availableRows.filter(
      (row) =>
        lessonRank(row.lesson_id) <= lessonRank(exercise.lessonId),
    );
    const learnedLexemes = learnedLexemeIdsThroughLesson(
      availableRows,
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
      availableRows,
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
      availableRows,
      exercise.lessonId,
    );
    const missingOptionSource = exercise.options.find(
      (option) =>
        option.sourceSentenceId &&
        !rowsBySentence.has(option.sourceSentenceId),
    );
    if (missingOptionSource) {
      errors.push(
        `${exercise.id} 找不到選項來源句 ${missingOptionSource.sourceSentenceId}。`,
      );
    }
    const earlyDistractor = exercise.options.find(
      (option) =>
        option.sourceSentenceId &&
        rowsBySentence.has(option.sourceSentenceId) &&
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
    const lessonExists = lessonIds.has(exercise.lessonId);
    if (!lessonExists) {
      errors.push(
        `${exercise.id} 找不到正式練習課程 ${exercise.lessonId}。`,
      );
    }
    if (!source) {
      errors.push(
        `${exercise.id} 找不到正式來源句 ${exercise.sourceSentenceId}。`,
      );
    }
    if (!lessonExists || !source) {
      continue;
    }
    if (
      lessonRank(source.lesson_id) > lessonRank(exercise.lessonId) ||
      source.sentence_pattern_id !== exercise.sentencePatternId ||
      source.passage_id !== exercise.passageId
    ) {
      errors.push(`${exercise.id} 的正式課程引用不一致。`);
      continue;
    }
    const learnedLexemes = learnedLexemeIdsThroughLesson(
      availableRows,
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
    availableRows.forEach((row) => {
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
    const learnedRows = availableRows.filter(
      (row) =>
        lessonRank(row.lesson_id) <= lessonRank(exercise.lessonId),
    );
    const learnedChunks = learnedChunkIdsThroughLesson(
      availableRows,
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
    const customSentences = passage.sentences ?? [];
    const customSentenceById = new Map(
      customSentences.map((sentence) => [sentence.id, sentence]),
    );
    const passageSentenceIds = new Set([
      ...passageRows.map((row) => row.sentence_id),
      ...customSentences.map((sentence) => sentence.id),
    ]);
    const sentenceOrders = customSentences
      .map((sentence) => sentence.order)
      .sort((left, right) => left - right);
    const passageCompletionLessonId = customSentences
      .map((sentence) => sentence.lessonId)
      .filter((lessonId): lessonId is string => Boolean(lessonId))
      .sort((left, right) => lessonRank(right) - lessonRank(left))[0];
    sentenceOrders.forEach((order, index) => {
      if (order !== index + 1) {
        errors.push(
          `${passage.passageId} 的自訂文章句序必須從 1 連續排列。`,
        );
      }
    });
    if (
      new Set(customSentences.map((sentence) => sentence.id)).size !==
      customSentences.length
    ) {
      errors.push(`${passage.passageId} 的文章 sentence ID 不可重複。`);
    }
    if (
      customSentences.some(
        (sentence) => !sentence.sentence || !sentence.translation,
      )
    ) {
      errors.push(`${passage.passageId} 的英文句子與繁中翻譯不可空白。`);
    }
    for (const sentence of customSentences) {
      if (!sentence.lessonId) continue;
      if (!lessonIds.has(sentence.lessonId)) {
        errors.push(
          `${sentence.id} 找不到文章檢查課程 ${sentence.lessonId}。`,
        );
        continue;
      }
      const learnedRows = availableRows.filter(
        (row) =>
          lessonRank(row.lesson_id) <= lessonRank(sentence.lessonId ?? ""),
      );
      const learnedLexemes = learnedLexemeIdsThroughLesson(
        availableRows,
        sentence.lessonId,
      );
      const unlearnedLexemes = (
        sentence.requiredLexemeIds ?? []
      ).filter((lexemeId) => !learnedLexemes.has(lexemeId));
      if (unlearnedLexemes.length) {
        errors.push(
          `${sentence.id} 使用尚未教過的 lexeme：${unlearnedLexemes.join("、")}。`,
        );
      }
      errors.push(
        ...validateReferencedLexemes(
          sentence.sentence,
          sentence.requiredLexemeIds ?? [],
          learnedRows,
          sentence.id,
        ),
      );
      const learnedChunks = learnedChunkIdsThroughLesson(
        availableRows,
        sentence.lessonId,
      );
      const unlearnedChunks = (
        sentence.requiredChunkIds ?? []
      ).filter((chunkId) => !learnedChunks.has(chunkId));
      if (unlearnedChunks.length) {
        errors.push(
          `${sentence.id} 使用尚未教過的 chunk：${unlearnedChunks.join("、")}。`,
        );
      }
    }
    for (const question of passage.questions) {
      const source = rowsBySentence.get(question.sourceSentenceId);
      const customSource = customSentenceById.get(
        question.sourceSentenceId,
      );
      if (
        (!source && !customSource) ||
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
      const optionMetadata = question.optionMetadata ?? [];
      if (passageCompletionLessonId && !question.optionMetadata?.length) {
        errors.push(`${question.id} 缺少選項先備內容 metadata。`);
      }
      if (optionMetadata.length) {
        const metadataTexts = optionMetadata.map((option) => option.text);
        if (
          optionMetadata.length !== question.options.length ||
          !sameStringSet(metadataTexts, question.options)
        ) {
          errors.push(`${question.id} 的選項與 optionMetadata 不一致。`);
        }
        if (new Set(metadataTexts).size !== metadataTexts.length) {
          errors.push(`${question.id} 的 optionMetadata 不可重複。`);
        }
      }
      if (passageCompletionLessonId) {
        const learnedRows = availableRows.filter(
          (row) =>
            lessonRank(row.lesson_id) <=
            lessonRank(passageCompletionLessonId),
        );
        const learnedLexemes = learnedLexemeIdsThroughLesson(
          availableRows,
          passageCompletionLessonId,
        );
        const learnedChunks = learnedChunkIdsThroughLesson(
          availableRows,
          passageCompletionLessonId,
        );
        for (const option of optionMetadata) {
          const unlearnedLexemes = option.requiredLexemeIds.filter(
            (lexemeId) => !learnedLexemes.has(lexemeId),
          );
          if (unlearnedLexemes.length) {
            errors.push(
              `${question.id}/${option.text} 提前使用 lexeme：${unlearnedLexemes.join("、")}。`,
            );
          }
          errors.push(
            ...validateReferencedLexemes(
              option.text,
              option.requiredLexemeIds,
              learnedRows,
              `${question.id}/${option.text}`,
            ),
          );
          const unlearnedChunks = (
            option.requiredChunkIds ?? []
          ).filter((chunkId) => !learnedChunks.has(chunkId));
          if (unlearnedChunks.length) {
            errors.push(
              `${question.id}/${option.text} 提前使用 chunk：${unlearnedChunks.join("、")}。`,
            );
          }
        }
      }
      const unknownEvidenceIds = (
        question.evidenceSentenceIds ?? []
      ).filter((sentenceId) => !passageSentenceIds.has(sentenceId));
      if (unknownEvidenceIds.length) {
        errors.push(
          `${question.id} 引用不存在的證據句：${unknownEvidenceIds.join("、")}。`,
        );
      }
      const answerPhrase = normalizeSentence(
        question.correctAnswer,
      );
      const evidenceIds =
        question.evidenceSentenceIds?.length
          ? question.evidenceSentenceIds
          : [question.sourceSentenceId];
      const evidenceSentences = evidenceIds.map((sentenceId) => {
        const formal = rowsBySentence.get(sentenceId);
        const custom = customSentenceById.get(sentenceId);
        return formal?.sentence ?? custom?.sentence ?? "";
      });
      if (
        !evidenceSentences.some((sentence) =>
          normalizeSentence(sentence).includes(answerPhrase),
        )
      ) {
        errors.push(
          `${question.id} 的答案與來源文章不一致。`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

export const loadCourseExerciseData = async (
  patternExercisesUrl: string,
  readingExercisesUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<CourseExerciseData> => {
  const [patternResponse, readingResponse] = await Promise.all([
    fetcher(patternExercisesUrl, { cache: "no-store" }),
    fetcher(readingExercisesUrl, { cache: "no-store" }),
  ]);
  if (!patternResponse.ok || !readingResponse.ok) {
    throw new Error("文字練習資料載入失敗。");
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

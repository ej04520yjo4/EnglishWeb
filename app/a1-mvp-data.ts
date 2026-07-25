import type {
  AudioStatus,
  CourseUnit,
  LearningToken,
  Lesson,
} from "./course-data";

export const OFFICIAL_A1_MVP_CSV_URL = "/data/a1-course-v3.csv";
export const OFFICIAL_A1_SOURCE_VERSION = "a1-course-v3.csv";
export const EXPECTED_A1_ROW_COUNT = 145;
export const EXPECTED_A1_UNIT_COUNT = 8;
export const EXPECTED_A1_LESSON_COUNT = 32;

export const A1_V3_HEADERS = [
  "level",
  "unit_id",
  "unit_title",
  "passage_id",
  "passage_order",
  "sentence_id",
  "sentence_order",
  "sentence_pattern_id",
  "pattern_name",
  "pattern_cefr",
  "is_new_sentence_pattern",
  "lesson_id",
  "lesson_title",
  "sentence",
  "translation",
  "grammar",
  "occurrence_id",
  "token_order",
  "token_id",
  "lexeme_id",
  "sense_id",
  "type",
  "answer",
  "lemma",
  "prompt",
  "prompt_type",
  "partOfSpeech",
  "dictionary_pos",
  "context_pos",
  "semanticRole",
  "chunk_id",
  "chunk_text",
  "chunk_translation",
  "chunk_order",
  "chunk_note",
  "pattern_id",
  "kk_us",
  "ipa_us",
  "ipa_standalone",
  "ipa_in_sentence",
  "kk",
  "ipa",
  "syllables",
  "stress_syllable",
  "display_syllables",
  "note",
  "audio_method",
  "audio_status",
  "word_audio_source",
  "audio_source",
  "sentence_audio_source",
  "license",
  "is_new_word",
  "is_new_pattern",
  "is_new_combination",
  "is_new_content",
  "qa_status",
] as const;

export type A1CourseCsvRow = Record<string, string>;

export type CourseValidationReport = {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  unmatchedIds: string[];
  validationErrors: string[];
  valid: boolean;
};

const REQUIRED_ROW_FIELDS = [
  "level",
  "unit_id",
  "unit_title",
  "passage_id",
  "sentence_id",
  "sentence_order",
  "sentence_pattern_id",
  "lesson_id",
  "lesson_title",
  "sentence",
  "translation",
  "grammar",
  "occurrence_id",
  "token_order",
  "token_id",
  "lexeme_id",
  "sense_id",
  "answer",
  "lemma",
  "prompt",
  "prompt_type",
  "context_pos",
] as const;

const UNIT_PRESENTATION: Record<string, { description: string; accent: string }> = {
  "a1-u1": {
    description: "從打招呼、姓名與來自哪裡開始建立基本句型。",
    accent: "#f47b5b",
  },
  "a1-u2": {
    description: "練習身邊常見物品、所有格與基本位置表達。",
    accent: "#f2a93b",
  },
  "a1-u3": {
    description: "介紹家人、朋友與人物之間的關係。",
    accent: "#e76c8a",
  },
  "a1-u4": {
    description: "用常見飲食情境練習喜好、需求與日常動作。",
    accent: "#68ad66",
  },
  "a1-u5": {
    description: "描述起床、工作、運動與晚間活動。",
    accent: "#5a95db",
  },
  "a1-u6": {
    description: "練習時間、星期、月份與日期範圍。",
    accent: "#8c78d7",
  },
  "a1-u7": {
    description: "描述地點、方向與日常交通方式。",
    accent: "#49a7a2",
  },
  "a1-u8": {
    description: "整合前面學過的單字與句型，重建一段完整短文。",
    accent: "#e08f55",
  },
};

const parseCsvMatrix = (csvText: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = csvText.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("CSV 含有未關閉的雙引號。");
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value !== ""));
};

export const parseA1MvpCsv = (csvText: string): A1CourseCsvRow[] => {
  const matrix = parseCsvMatrix(csvText);
  const headers = matrix[0] ?? [];
  if (headers[0] !== "level") {
    throw new Error("A1 v3 CSV 的第一個欄位必須是 level。");
  }
  return matrix.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
};

export const normalizeA1CourseRows = (
  rows: Record<string, unknown>[],
): A1CourseCsvRow[] =>
  rows.map((row) =>
    Object.fromEntries(
      A1_V3_HEADERS.map((header) => [header, String(row[header] ?? "")]),
    ),
  );

const csvEscape = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

export const serializeA1MvpCsv = (rows: A1CourseCsvRow[]) =>
  [
    A1_V3_HEADERS.map(csvEscape).join(","),
    ...rows.map((row) =>
      A1_V3_HEADERS.map((header) => csvEscape(row[header] ?? "")).join(","),
    ),
  ].join("\r\n");

const numberValue = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const booleanValue = (value: string) => value.trim().toUpperCase() === "TRUE";

const idNumber = (id: string, marker: "u" | "l") => {
  const match = id.match(new RegExp(`-${marker}(\\d+)$`));
  return match ? Number(match[1]) : 0;
};

const terminalPunctuation = (sentence: string) =>
  sentence.trim().match(/[.!?]$/)?.[0] ?? ".";

const tokenFromRow = (row: A1CourseCsvRow): LearningToken => ({
  id: row.occurrence_id,
  occurrenceId: row.occurrence_id,
  tokenId: row.token_id,
  answer: row.answer,
  prompt: row.prompt,
  promptType: row.prompt_type as LearningToken["promptType"],
  partOfSpeech: row.context_pos,
  dictionaryPos: row.dictionary_pos,
  contextPos: row.context_pos,
  semanticRole: row.semanticRole,
  lexemeId: row.lexeme_id,
  senseId: row.sense_id,
  kk: row.kk_us || row.kk,
  ipa: row.ipa_standalone || row.ipa_us || row.ipa,
  ipaStandalone: row.ipa_standalone,
  ipaInSentence: row.ipa_in_sentence,
  syllables: row.display_syllables || row.syllables,
  stress: row.stress_syllable,
  lemma: row.lemma,
  note: row.note,
  chunk: row.chunk_id
    ? {
        id: row.chunk_id,
        text: row.chunk_text,
        translation: row.chunk_translation,
        order: numberValue(row.chunk_order, 0),
        note: row.chunk_note,
      }
    : undefined,
  patternId: row.pattern_id,
  audioMethod: row.audio_method,
  audioStatus: (row.audio_status || "pending") as AudioStatus,
  wordAudioSource: row.word_audio_source,
  audioSource: row.audio_source,
  license: row.license,
  isNewWord: booleanValue(row.is_new_word),
  isNewPattern: booleanValue(row.is_new_pattern),
  isNewCombination: booleanValue(row.is_new_combination),
  isNewContent: booleanValue(row.is_new_content),
  qaStatus: row.qa_status,
});

export const buildCourseUnitsFromRows = (
  rows: A1CourseCsvRow[],
): CourseUnit[] => {
  const unitRows = new Map<string, A1CourseCsvRow[]>();
  rows.forEach((row) => {
    const current = unitRows.get(row.unit_id) ?? [];
    current.push(row);
    unitRows.set(row.unit_id, current);
  });

  return Array.from(unitRows.entries())
    .sort(([left], [right]) => idNumber(left, "u") - idNumber(right, "u"))
    .map(([unitId, rowsForUnit]) => {
      const lessonRows = new Map<string, A1CourseCsvRow[]>();
      rowsForUnit.forEach((row) => {
        const current = lessonRows.get(row.lesson_id) ?? [];
        current.push(row);
        lessonRows.set(row.lesson_id, current);
      });

      const lessons = Array.from(lessonRows.entries())
        .sort(([left], [right]) => idNumber(left, "l") - idNumber(right, "l"))
        .map(([lessonId, rowsForLesson]): Lesson => {
          const orderedRows = [...rowsForLesson].sort(
            (left, right) =>
              numberValue(left.token_order, 0) - numberValue(right.token_order, 0),
          );
          const first = orderedRows[0];
          return {
            id: lessonId,
            number: idNumber(lessonId, "l"),
            title: first.lesson_title,
            sentence: first.sentence,
            translation: first.translation,
            grammar: first.grammar,
            minutes: Math.max(4, Math.ceil(orderedRows.length * 1.25)),
            tokens: orderedRows.map(tokenFromRow),
            passageId: first.passage_id,
            passageOrder: numberValue(first.passage_order, 1),
            sentenceId: first.sentence_id,
            sentenceOrder: numberValue(first.sentence_order, 1),
            sentencePatternId: first.sentence_pattern_id,
            patternName: first.pattern_name,
            patternCefr: first.pattern_cefr,
            isNewSentencePattern: booleanValue(first.is_new_sentence_pattern),
            sentenceAudioSource: first.sentence_audio_source,
            audioStatus: (first.audio_status || "pending") as AudioStatus,
            sourceVersion: OFFICIAL_A1_SOURCE_VERSION,
          };
        });
      const presentation = UNIT_PRESENTATION[unitId] ?? {
        description: "依序完成本單元的四個句子。",
        accent: "#f47b5b",
      };
      return {
        id: unitId,
        number: idNumber(unitId, "u"),
        title: rowsForUnit[0].unit_title,
        description: presentation.description,
        accent: presentation.accent,
        lessons,
      };
    });
};

export const flattenCourseLessons = (courseUnits: CourseUnit[]) =>
  courseUnits.flatMap((unit) =>
    unit.lessons.map((lesson) => ({ ...lesson, unit })),
  );

const pushRowError = (
  rowIssues: Set<number>,
  errors: string[],
  rowIndex: number,
  message: string,
) => {
  rowIssues.add(rowIndex);
  errors.push(`第 ${rowIndex + 2} 列：${message}`);
};

export const validateA1CourseRows = (
  rows: A1CourseCsvRow[],
  expectedOccurrenceIds?: Iterable<string>,
): CourseValidationReport => {
  const errors: string[] = [];
  const rowIssues = new Set<number>();
  const unmatchedIds: string[] = [];
  const expectedIds = expectedOccurrenceIds
    ? new Set(expectedOccurrenceIds)
    : undefined;
  const seenOccurrences = new Map<string, number>();

  rows.forEach((row, rowIndex) => {
    const missingFields = REQUIRED_ROW_FIELDS.filter(
      (field) => !String(row[field] ?? "").trim(),
    );
    if (missingFields.length) {
      pushRowError(
        rowIssues,
        errors,
        rowIndex,
        `必要欄位不可空白：${missingFields.join("、")}`,
      );
    }
    if (!/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(row.answer ?? "")) {
      pushRowError(rowIssues, errors, rowIndex, "answer 必須只有一個英文單字。");
    }
    if (!["meaning", "grammar", "context"].includes(row.prompt_type)) {
      pushRowError(rowIssues, errors, rowIndex, "prompt_type 不符合 v3 格式。");
    }
    if (row.chunk_id) {
      const missingChunkFields = [
        "chunk_text",
        "chunk_translation",
        "chunk_order",
        "chunk_note",
      ].filter((field) => !row[field]);
      if (missingChunkFields.length) {
        pushRowError(
          rowIssues,
          errors,
          rowIndex,
          `語塊欄位不可空白：${missingChunkFields.join("、")}`,
        );
      }
    }
    if (seenOccurrences.has(row.occurrence_id)) {
      pushRowError(
        rowIssues,
        errors,
        rowIndex,
        `occurrence_id 重複：${row.occurrence_id}`,
      );
      rowIssues.add(seenOccurrences.get(row.occurrence_id)!);
    } else {
      seenOccurrences.set(row.occurrence_id, rowIndex);
    }
    if (expectedIds && !expectedIds.has(row.occurrence_id)) {
      unmatchedIds.push(row.occurrence_id || `(第 ${rowIndex + 2} 列無 ID)`);
      rowIssues.add(rowIndex);
    }
  });

  if (rows.length !== EXPECTED_A1_ROW_COUNT) {
    errors.push(
      `正式 A1 資料應有 ${EXPECTED_A1_ROW_COUNT} 列，目前為 ${rows.length} 列。`,
    );
  }

  const unitIds = new Set(rows.map((row) => row.unit_id));
  const lessonIds = new Set(rows.map((row) => row.lesson_id));
  if (unitIds.size !== EXPECTED_A1_UNIT_COUNT) {
    errors.push(
      `正式 A1 資料應建立 ${EXPECTED_A1_UNIT_COUNT} 個單元，目前為 ${unitIds.size} 個。`,
    );
  }
  if (lessonIds.size !== EXPECTED_A1_LESSON_COUNT) {
    errors.push(
      `正式 A1 資料應建立 ${EXPECTED_A1_LESSON_COUNT} 課，目前為 ${lessonIds.size} 課。`,
    );
  }

  lessonIds.forEach((lessonId) => {
    const indexedRows = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.lesson_id === lessonId)
      .sort(
        (left, right) =>
          numberValue(left.row.token_order, 0) -
          numberValue(right.row.token_order, 0),
      );
    indexedRows.forEach(({ row, index }, tokenIndex) => {
      if (numberValue(row.token_order, 0) !== tokenIndex + 1) {
        pushRowError(
          rowIssues,
          errors,
          index,
          `${lessonId} 的 token_order 必須從 1 連續排列。`,
        );
      }
    });
    const first = indexedRows[0]?.row;
    if (!first) return;
    const reconstructed =
      indexedRows.map(({ row }) => row.answer).join(" ") +
      terminalPunctuation(first.sentence);
    if (reconstructed !== first.sentence) {
      indexedRows.forEach(({ index }) => rowIssues.add(index));
      errors.push(
        `${lessonId} 的 token 合併後為「${reconstructed}」，無法還原「${first.sentence}」。`,
      );
    }
  });

  const tokenAnswers = new Map<string, string>();
  rows.forEach((row, index) => {
    const existing = tokenAnswers.get(row.token_id);
    if (existing && existing.toLowerCase() !== row.answer.toLowerCase()) {
      pushRowError(
        rowIssues,
        errors,
        index,
        `token_id ${row.token_id} 對應了不同答案。`,
      );
    } else if (!existing) {
      tokenAnswers.set(row.token_id, row.answer);
    }
  });

  if (expectedIds) {
    const importedIds = new Set(rows.map((row) => row.occurrence_id));
    const missingIds = Array.from(expectedIds).filter(
      (occurrenceId) => !importedIds.has(occurrenceId),
    );
    if (missingIds.length) {
      errors.push(`缺少正式 occurrence_id：${missingIds.join("、")}`);
    }
  }

  const unitEightSentences = Array.from(
    new Map(
      rows
        .filter((row) => row.unit_id === "a1-u8")
        .sort(
          (left, right) =>
            numberValue(left.sentence_order, 0) -
            numberValue(right.sentence_order, 0),
        )
        .map((row) => [row.sentence_id, row.sentence]),
    ).values(),
  );
  const expectedUnitEight = [
    "I get up at seven.",
    "I eat breakfast at home.",
    "I go to work at eight.",
    "I go to work by bus.",
  ];
  if (JSON.stringify(unitEightSentences) !== JSON.stringify(expectedUnitEight)) {
    errors.push("A1 第 8 單元的四句短文內容或順序不符合 v3 正式資料。");
  }
  if (
    rows.some(
      (row) =>
        row.answer.toLowerCase() === "would" ||
        row.sentence.toLowerCase().includes("would like to"),
    )
  ) {
    errors.push("A1 第 8 單元不可包含 would like to。");
  }

  const hasGlobalFailure =
    errors.length > 0 && rowIssues.size === 0;
  const failedRows = hasGlobalFailure ? rows.length : rowIssues.size;
  return {
    totalRows: rows.length,
    successfulRows: Math.max(0, rows.length - failedRows),
    failedRows,
    unmatchedIds: Array.from(new Set(unmatchedIds)),
    validationErrors: Array.from(new Set(errors)),
    valid: errors.length === 0 && unmatchedIds.length === 0,
  };
};

export const loadA1CourseData = async (
  fetcher: typeof fetch = fetch,
): Promise<{ rows: A1CourseCsvRow[]; courseUnits: CourseUnit[] }> => {
  const response = await fetcher(OFFICIAL_A1_MVP_CSV_URL, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`A1 v3 CSV 載入失敗（${response.status}）。`);
  }
  const rows = parseA1MvpCsv(await response.text());
  const report = validateA1CourseRows(rows);
  if (!report.valid) {
    throw new Error(report.validationErrors.join("\n"));
  }
  return {
    rows,
    courseUnits: buildCourseUnitsFromRows(rows),
  };
};
